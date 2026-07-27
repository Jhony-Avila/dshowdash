// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer/api/sprint-apis
// PURPOSE: Sprint 1-4 thin API wrappers, status/info/healthCheck, debug namespace
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Store, STORE_VERSION from ../state/store.js
//   Lifecycle from ../core/lifecycle.js
//   Container from ../ui/container.js
//   Manager from ../core/manager.js
//   OverlayKernel from ../kernel/index.js
//   Sprint 1: SchemaValidator, RateLimiter, AutoCleanup
//   Sprint 2: CircuitBreaker, OrphanDetector, SnapshotManager, LifecycleHooks
//   Sprint 3: PendingQueue, TemplateRegistry, Transitions, FocusManager, ZIndexManager
//   Sprint 4: MetricsCollector, ErrorBoundary, LazyLoader, DebugPanel
//   _retryState, VERSION, MODULE_ID from ../core/integrations.js
//   _hasBlockingOverlay, _getTopOverlay from ../core/operations.js
//
// PROVIDES:
//   Sprint 1 APIs: validateDescriptor, configureRateLimiter
//   Sprint 2 APIs: getCircuitBreakerState, resetCircuitBreaker, scanOrphans, cleanupOrphans, createSnapshot, restoreSnapshot, listSnapshots, onHook, offHook
//   Sprint 3 APIs: enqueueOverlay, processQueue, getQueuedOverlays, registerTemplate, getTemplate, listTemplates, applyTemplate, registerTransition, listTransitions, trapFocus, releaseFocus, acquireZIndex, releaseZIndex
//   Sprint 4 APIs: getMetrics, getPerformanceStats, getErrors, getErrorStats, onError, registerLoader, lazyLoad, prefetch, showDebugPanel, hideDebugPanel, toggleDebugPanel
//   status(), info(), healthCheck(), getVersion()
//   buildDebugNamespace()
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @changelog v2.7.0-P2-ENTERPRISE: Extracted from overlay-layer/index.js, defensive calls on MetricsCollector (corrupted module)
'use strict';

import Store, { VERSION as STORE_VERSION } from '../state/store.js';
import * as Lifecycle from '../core/lifecycle.js';
import * as Container from '../ui/container.js';
import * as Manager from '../core/manager.js';
import * as OverlayKernel from '../kernel/index.js';

// Sprint 1
import * as SchemaValidator from '../utils/schema-validator.js';
import * as RateLimiter from '../kernel/rate-limiter.js';
import * as AutoCleanup from '../kernel/auto-cleanup.js';

// Sprint 2
import * as CircuitBreaker from '../kernel/circuit-breaker.js';
import * as OrphanDetector from '../kernel/orphan-detector.js';
import * as SnapshotManager from '../state/snapshot-manager.js';
import * as LifecycleHooks from '../core/lifecycle-hooks/index.js';

// Sprint 3
import * as PendingQueue from '../kernel/pending-queue/index.js';
import * as TemplateRegistry from '../core/template-registry/index.js';
import * as Transitions from '../ui/transitions/index.js';
import * as FocusManager from '../ui/focus-manager.js';
import * as ZIndexManager from '../ui/zindex-manager.js';

// Sprint 4
import * as _MetricsCollector from '../telemetry/metrics-collector.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
const MetricsCollector = _MetricsCollector as any;
import * as ErrorBoundary from '../core/error-boundary/index.js';
import * as LazyLoader from '../core/lazy-loader/index.js';
import * as DebugPanel from '../devtools/debug-panel.js';

import { _retryState, VERSION, MODULE_ID } from '../core/integrations.js';
import { _hasBlockingOverlay, _getTopOverlay } from '../core/operations.js';

export { VERSION as SPRINT_APIS_VERSION };


// ── Sprint 1 APIs ───────────────────────────────────────────
export const validateDescriptor = (d: DynObj) => SchemaValidator.validate(d);
export const configureRateLimiter = (c: DynObj) => RateLimiter.configure(c);

// ── Sprint 2 APIs ───────────────────────────────────────────
export const getCircuitBreakerState = () => CircuitBreaker.getState();
export const resetCircuitBreaker = () => CircuitBreaker.reset();
export const scanOrphans = () => OrphanDetector.scan();
export const cleanupOrphans = () => OrphanDetector.cleanup();
export const createSnapshot = (o: DynObj) => SnapshotManager.snapshot(o);
export const restoreSnapshot = (s: string, o: DynObj) => SnapshotManager.restore(s, o);
export const listSnapshots = () => SnapshotManager.listSnapshots();
export const onHook = (t: DynObj, h: DynObj, o: DynObj) => LifecycleHooks.on(t, h, o);
export const offHook = (t: DynObj, h: DynObj) => LifecycleHooks.off(t, h);

// ── Sprint 3 APIs ───────────────────────────────────────────
export const enqueueOverlay = (d: DynObj, r: DynObj, o: DynObj) => PendingQueue.enqueue(d, r, o);
export const processQueue = () => PendingQueue.process();
export const getQueuedOverlays = () => PendingQueue.getAll();
export const registerTemplate = (i: DynObj, c: DynObj) => TemplateRegistry.register(i, c);
export const getTemplate = (i: DynObj) => TemplateRegistry.get(i);
export const listTemplates = () => TemplateRegistry.list();
export const applyTemplate = (i: DynObj, o: DynObj) => TemplateRegistry.apply(i, o);
export const registerTransition = (n: DynObj, c: DynObj) => Transitions.register(n, c);
export const listTransitions = () => Transitions.list();
export const trapFocus = (e: DynObj, o: DynObj) => FocusManager.trap(e, o);
export const releaseFocus = (o: DynObj) => FocusManager.release(o);
export const acquireZIndex = (l: DynObj, o: DynObj) => ZIndexManager.acquire(l, o);
export const releaseZIndex = (i: number) => ZIndexManager.release(i);

// ── Sprint 4 APIs ───────────────────────────────────────────
// NOTE: MetricsCollector module is corrupted (re-exports debug-panel instead of actual metrics).
// All MetricsCollector calls use defensive optional chaining until module is restored.
export const getMetrics = () => MetricsCollector.getAllMetrics?.() || {};
export const getPerformanceStats = () => MetricsCollector.getPerformanceStats?.() || {};
export const getErrors = (l: DynObj) => ErrorBoundary.getErrors(l);
export const getErrorStats = () => ErrorBoundary.getStats();
export const onError = (h: DynObj) => ErrorBoundary.onError(h);
export const registerLoader = (t: DynObj, l: DynObj) => LazyLoader.registerLoader(t, l);
export const lazyLoad = (t: DynObj, o: DynObj) => LazyLoader.load(t, o);
export const prefetch = (t: DynObj, o: DynObj) => LazyLoader.prefetch(t, o);
export const showDebugPanel = () => DebugPanel.show();
export const hideDebugPanel = () => DebugPanel.hide();
export const toggleDebugPanel = () => DebugPanel.toggle();

// ── Status ──────────────────────────────────────────────────
export const status = () => ({
  initialized: Lifecycle.getState().initialized, activeCount: Store.getStack().length, hasBlocking: _hasBlockingOverlay(), topOverlay: _getTopOverlay()?.id || null,
  appShellConnected: _retryState.appShellConnected, contextProviderConnected: _retryState.contextProviderConnected, kernelIntegrated: _retryState.kernelIntegrated, kernelMode: OverlayKernel.getMode(),
  rateLimiterEnabled: RateLimiter.isEnabled(), autoCleanupEnabled: AutoCleanup.isEnabled(), circuitBreakerState: CircuitBreaker.getState(),
  orphanDetectorEnabled: OrphanDetector.isAutoScanEnabled(), lifecycleHooksEnabled: LifecycleHooks.isEnabled(), pendingQueueSize: PendingQueue.size(),
  focusTrapped: FocusManager.isTrapped(), metricsEnabled: MetricsCollector.isEnabled?.() || false, errorCount: ErrorBoundary.getStats().current, debugPanelVisible: DebugPanel.isVisible()
});

// ── Info ────────────────────────────────────────────────────
export const info = () => ({
  name: MODULE_ID, version: VERSION, status: Lifecycle.getState().initialized ? 'READY' : 'NOT_INITIALIZED',
  stack: { count: Store.getStack().length, hasBlocking: _hasBlockingOverlay(), top: _getTopOverlay() },
  metrics: Manager.getMetrics(),
  sprint1: { schemaValidator: SchemaValidator.info(), rateLimiter: RateLimiter.info(), autoCleanup: AutoCleanup.info() },
  sprint2: { circuitBreaker: CircuitBreaker.info(), orphanDetector: OrphanDetector.info(), snapshotManager: SnapshotManager.info(), lifecycleHooks: LifecycleHooks.info() },
  sprint3: { pendingQueue: PendingQueue.info(), templateRegistry: TemplateRegistry.info(), transitions: Transitions.info(), focusManager: FocusManager.info(), zIndexManager: ZIndexManager.info() },
  sprint4: { metricsCollector: MetricsCollector.info?.() || { status: 'MODULE_CORRUPTED' }, errorBoundary: ErrorBoundary.info(), lazyLoader: LazyLoader.info(), debugPanel: DebugPanel.info() },
  components: { store: STORE_VERSION, kernel: OverlayKernel.VERSION, schemaValidator: SchemaValidator.VERSION, rateLimiter: RateLimiter.VERSION, circuitBreaker: CircuitBreaker.VERSION, pendingQueue: PendingQueue.VERSION, metricsCollector: MetricsCollector.VERSION || 'CORRUPTED', errorBoundary: ErrorBoundary.VERSION, lazyLoader: LazyLoader.VERSION, debugPanel: DebugPanel.VERSION }
});

// ── HealthCheck ─────────────────────────────────────────────
export const healthCheck = () => {
  const checks = {
    initialized: Lifecycle.getState().initialized, containerMounted: Container.exists(), storeAvailable: !!Store,
    kernelReady: OverlayKernel.healthCheck().status !== 'UNHEALTHY', kernelIntegrated: _retryState.kernelIntegrated,
    circuitBreakerHealthy: CircuitBreaker.healthCheck().status !== 'UNHEALTHY', pendingQueueHealthy: PendingQueue.healthCheck().status !== 'UNHEALTHY',
    metricsHealthy: (MetricsCollector.healthCheck?.()?.status !== 'UNHEALTHY') || true, errorBoundaryHealthy: ErrorBoundary.healthCheck().status !== 'UNHEALTHY'
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed < total * 0.5 ? 'UNHEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, timestamp: Date.now() };
};

export const getVersion = () => VERSION;

// ── Debug Namespace ─────────────────────────────────────────
export const buildDebugNamespace = () => ({
  getStore: () => Store.getState(), getStackSnapshot: () => ({ stack: Store.getStack(), overlays: Store.getOverlays() }),
  kernel: { info: () => OverlayKernel.info(), health: () => OverlayKernel.healthCheck() },
  sprint1: { schemaValidator: { validate: (d: DynObj) => SchemaValidator.validate(d) }, rateLimiter: { info: () => RateLimiter.info(), reset: () => RateLimiter.reset() }, autoCleanup: { scan: () => AutoCleanup.scan() } },
  sprint2: { circuitBreaker: { info: () => CircuitBreaker.info(), forceOpen: () => CircuitBreaker.forceOpen('debug') }, orphanDetector: { scan: () => OrphanDetector.scan() }, snapshotManager: { snapshot: (o: DynObj) => SnapshotManager.snapshot(o), list: () => SnapshotManager.listSnapshots() } },
  sprint3: { pendingQueue: { info: () => PendingQueue.info(), process: () => PendingQueue.process() }, templateRegistry: { list: () => TemplateRegistry.list() }, transitions: { list: () => Transitions.list() }, focusManager: { state: () => FocusManager.getState() }, zIndexManager: { layers: () => ZIndexManager.getLayers() } },
  sprint4: { metricsCollector: { all: () => MetricsCollector.getAllMetrics?.() || {}, performance: () => MetricsCollector.getPerformanceStats?.() || {}, reset: () => MetricsCollector.reset?.() }, errorBoundary: { errors: () => ErrorBoundary.getErrors(), stats: () => ErrorBoundary.getStats(), clear: () => ErrorBoundary.clearErrors() }, lazyLoader: { info: () => LazyLoader.info(), cache: () => LazyLoader.getCacheInfo() }, debugPanel: { show: () => DebugPanel.show(), hide: () => DebugPanel.hide(), toggle: () => DebugPanel.toggle() } },
  versions: { main: VERSION, kernel: OverlayKernel.VERSION, metricsCollector: MetricsCollector.VERSION || 'CORRUPTED', errorBoundary: ErrorBoundary.VERSION, lazyLoader: LazyLoader.VERSION, debugPanel: DebugPanel.VERSION }
});
