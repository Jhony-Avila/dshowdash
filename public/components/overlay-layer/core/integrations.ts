// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer/core/integrations
// PURPOSE: Ports, Logging, Retry Logic, Integration Setup (AppShell, ContextProvider, Kernel, Sprints)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   Store from ../state/store.js
//   Tracker from ../telemetry/tracker.js
//   OverlayKernel from ../kernel/index.js
//   Sprint modules: AutoCleanup, CircuitBreaker, OrphanDetector, SnapshotManager,
//     LifecycleHooks, PendingQueue, TemplateRegistry, SchemaValidator,
//     MetricsCollector, ErrorBoundary, DebugPanel
//   Lifecycle from ./lifecycle.js
//
// PROVIDES:
//   VERSION, MODULE_ID, MAX_RETRY_ATTEMPTS, RETRY_BASE_DELAY — constants
//   Ports, _initPorts, _getPort, injectPorts, getPorts — port infrastructure
//   _log — logging helper
//   _retryState — retry tracking object
//   injectOps — inject open/close operations (resolve circular dependency)
//   setupAppShellIntegration, setupContextProviderIntegration, setupKernelIntegration — integration setup
//   setupSprint1, setupSprint2, setupSprint3, setupSprint4 — sprint initialization
//   retryAppShellIntegration, retryContextProviderIntegration, retryAllIntegrations — retry functions
//   syncWithContextProvider — context sync
//   createInit — factory for init()
//   shutdown, reset, isInitialized — lifecycle operations
//
// RECEIVES (via factory/injection):
//   ops = { open, close } — injected via injectOps() after operations module is created
//   runtimeContext — passed to init()
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @changelog v2.7.0-P2-ENTERPRISE: Extracted from overlay-layer/index.js during modularization
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

import Store from '../state/store.js';
import * as Tracker from '../telemetry/tracker.js';
import * as OverlayKernel from '../kernel/index.js';

// Sprint 1
import * as SchemaValidator from '../utils/schema-validator.js';
import * as RateLimiter from '../kernel/rate-limiter.js';
import * as AutoCleanup from '../kernel/auto-cleanup.js';

// Sprint 2
import * as CircuitBreaker from '../kernel/circuit-breaker.js';
import * as OrphanDetector from '../kernel/orphan-detector.js';
import * as SnapshotManager from '../state/snapshot-manager.js';
import * as LifecycleHooks from './lifecycle-hooks/index.js';

// Sprint 3
import * as PendingQueue from '../kernel/pending-queue/index.js';
import * as TemplateRegistry from './template-registry/index.js';
import * as Transitions from '../ui/transitions/index.js';
import * as FocusManager from '../ui/focus-manager.js';
import * as ZIndexManager from '../ui/zindex-manager.js';

// Sprint 4
import * as _MetricsCollector from '../telemetry/metrics-collector.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
const MetricsCollector = _MetricsCollector as any;
import * as ErrorBoundary from './error-boundary/index.js';
import * as DebugPanel from '../devtools/debug-panel.js';

import * as Lifecycle from './lifecycle.js';


export const VERSION = '2.7.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer';
export const MAX_RETRY_ATTEMPTS = 5;
export const RETRY_BASE_DELAY = 300;

// ── Port Infrastructure ─────────────────────────────────────
export const Ports = createCorePorts({ moduleId: MODULE_ID });
export const _initPorts = () => Ports.init();
export const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: DynObj) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => _getPort('config')?.app?.debug || false;
export const _log = (level: DynObj, ...args: DynObj[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { logger.error?.(prefix, ...args); return; }
  if (level === 'warn') { logger.warn?.(prefix, ...args); return; }
  if (_debug()) logger.debug?.(prefix, ...args);
};

// ── Retry State ─────────────────────────────────────────────
export const _retryState = { appShellAttempts: 0, appShellConnected: false, contextProviderAttempts: 0, contextProviderConnected: false, kernelIntegrated: false };

// ── Operations holder (injected after operations.js is created) ──
let _ops = { open: null as DynObj, close: null as DynObj };
export const injectOps = (ops: DynObj) => { _ops = ops; };

// ── AppShell Integration ────────────────────────────────────
export const setupAppShellIntegration = (attempt = 1): DynObj  => {
  _retryState.appShellAttempts = attempt;
  const appShell = _getPort('appShell');
  const hasAppShell = appShell && (appShell.getContainer || appShell.adapter?.getContainer);
  if (!hasAppShell) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      return new Promise((r): DynObj  => setTimeout(r, RETRY_BASE_DELAY * attempt)).then(() => setupAppShellIntegration(attempt + 1));
    }
    Tracker.trackEvent('appshell:using-fallback', { attempts: attempt });
    return Promise.resolve(false);
  }
  try {
    const container = appShell.getContainer?.('overlay') || appShell.adapter?.getContainer?.('overlay');
    if (container) { _retryState.appShellConnected = true; return Promise.resolve(container); }
  } catch (error: any) { _log('error', 'AppShell error:', error.message); }
  return Promise.resolve(false);
};

// ── Context Provider ────────────────────────────────────────
export const syncWithContextProvider = () => {
  const cp = _getPort('contextProvider');
  if (!cp?.set) return false;
  try { const stack = Store.getStack(); cp.set('ui.overlay.stack', stack); cp.set('ui.overlay.hasBlocking', _hasBlockingCheck()); cp.set('ui.overlay.activeCount', stack.length); return true; } catch (e) { return false; }
};

// Helper for blocking check (avoids circular dependency with operations)
const _hasBlockingCheck = () => {
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  return stack.some(id => { const o = (overlays as DynObj)[id]; return o?.config?.blocking === true || o?.type === 'modal'; });
};

export const setupContextProviderIntegration = (attempt = 1): DynObj  => {
  _retryState.contextProviderAttempts = attempt;
  const cp = _getPort('contextProvider');
  if (!cp?.set) {
    if (attempt < MAX_RETRY_ATTEMPTS) return new Promise((r): DynObj  => setTimeout(r, RETRY_BASE_DELAY * attempt)).then(() => setupContextProviderIntegration(attempt + 1));
    return Promise.resolve(false);
  }
  try { syncWithContextProvider(); _retryState.contextProviderConnected = true; return Promise.resolve(true); } catch (error: any) { return Promise.resolve(false); }
};

// ── Kernel Integration ──────────────────────────────────────
export const setupKernelIntegration = (runtimeContext: Record<string, unknown> = {}) => {
  try {
    const result = OverlayKernel.init({ eventBus: runtimeContext.eventBus || _getPort('eventBus'), ports: Ports.snapshot(), applicationKernel: runtimeContext.applicationKernel || window?.ApplicationKernel, permissionsGuard: runtimeContext.permissionsGuard || window?.PermissionsGuard });
    if (result.ok) { _retryState.kernelIntegrated = result.data?.runtimeIntegrated || false; return true; }
    return false;
  } catch (error: any) { _log('error', 'Kernel error:', error.message); return false; }
};

// ── Sprint Setup ────────────────────────────────────────────
export const setupSprint1 = () => {
  AutoCleanup.inject({ store: Store, closeOverlay: (id: DynObj, r: DynObj) => _ops.close(id, r), eventBus: _getPort('eventBus') });
  AutoCleanup.enable({ scanInterval: 30000 });
};

export const setupSprint2 = () => {
  CircuitBreaker.inject({ eventBus: _getPort('eventBus') });
  OrphanDetector.inject({ store: Store, closeOverlay: (id: DynObj, r: DynObj) => _ops.close(id, r), eventBus: _getPort('eventBus') });
  OrphanDetector.enableAutoScan(60000);
  SnapshotManager.inject({ store: Store, openOverlay: (d: DynObj, o: DynObj) => _ops.open(d, o), closeOverlay: (id: DynObj, r: DynObj) => _ops.close(id, r) });
  LifecycleHooks.inject({ logger: _getPort('logger') });
};

export const setupSprint3 = () => {
  PendingQueue.inject({ openOverlay: (d: DynObj, o: DynObj) => _ops.open(d, { ...o, bypassQueue: true }), canOpenOverlay: (t: DynObj, o: DynObj) => OverlayKernel.canOpenOverlay(t, o), eventBus: _getPort('eventBus') });
  PendingQueue.startAutoProcess(5000);
  TemplateRegistry.inject({ schemaValidator: SchemaValidator });
};

export const setupSprint4 = (overlayLayerRef: DynObj) => {
  MetricsCollector.enable();
  ErrorBoundary.inject({ logger: _getPort('logger'), metricsCollector: MetricsCollector });
  DebugPanel.inject({ overlayLayer: overlayLayerRef });
  DebugPanel.init(overlayLayerRef);
  _log('info', 'Sprint 4 modules initialized');
};

// ── Retry Helpers ───────────────────────────────────────────
export const retryAppShellIntegration = () => { _retryState.appShellConnected = false; return setupAppShellIntegration(1); };
export const retryContextProviderIntegration = () => { _retryState.contextProviderConnected = false; return setupContextProviderIntegration(1); };
export const retryAllIntegrations = () => Promise.all([retryAppShellIntegration(), retryContextProviderIntegration()]).then((r) => ({ appShell: !!r[0], contextProvider: r[1], kernel: _retryState.kernelIntegrated }));

// ── Init Factory ────────────────────────────────────────────
export const createInit = (overlayLayerRef: DynObj) => {
  return (runtimeContext: Record<string, unknown> = {}) => {
    _initPorts();
    if (runtimeContext.eventBus) Ports.inject({ eventBus: runtimeContext.eventBus });
    if (runtimeContext.contextProvider) Ports.inject({ contextProvider: runtimeContext.contextProvider });
    if (runtimeContext.appShell) Ports.inject({ appShell: runtimeContext.appShell });
    if (runtimeContext.logger) Ports.inject({ logger: runtimeContext.logger });
    if (runtimeContext.config) Ports.inject({ config: runtimeContext.config });

    setupKernelIntegration(runtimeContext);
    setupSprint1();
    setupSprint2();
    setupSprint3();
    setupSprint4(overlayLayerRef);

    return setupAppShellIntegration().then((container: HTMLElement) => {
      const opts = container ? { parentElement: container } : {};
      return (Lifecycle.init as any)(opts);
    }).then((result: DynObj) => setupContextProviderIntegration().then(() => { Store.subscribe(() => syncWithContextProvider()); return result; }));
  };
};

// ── Shutdown ────────────────────────────────────────────────
export const shutdown = () => {
  _retryState.appShellConnected = false; _retryState.contextProviderConnected = false; _retryState.kernelIntegrated = false;
  AutoCleanup.disable(); OrphanDetector.disableAutoScan(); PendingQueue.stopAutoProcess(); FocusManager.release(); Transitions.cancelAll(); DebugPanel.destroy();
  OverlayKernel.shutdown('overlay-layer-shutdown'); Lifecycle.unmount(); Store.clear();
  return true;
};

// ── Reset ───────────────────────────────────────────────────
export const reset = () => { Store.clear(); Lifecycle.unmount(); RateLimiter.reset(); CircuitBreaker.reset(); SnapshotManager.clearSnapshots(); PendingQueue.clear(); ZIndexManager.reset(); MetricsCollector.reset(); ErrorBoundary.clearErrors(); return true; };

// ── IsInitialized ───────────────────────────────────────────
export const isInitialized = () => Lifecycle.isInitialized();
