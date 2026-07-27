import { createCorePorts } from "/core/runtime/ports-profiles.js";
import Store from "../state/store.js";
import * as Tracker from "../telemetry/tracker.js";
import * as OverlayKernel from "../kernel/index.js";
import * as SchemaValidator from "../utils/schema-validator.js";
import * as RateLimiter from "../kernel/rate-limiter.js";
import * as AutoCleanup from "../kernel/auto-cleanup.js";
import * as CircuitBreaker from "../kernel/circuit-breaker.js";
import * as OrphanDetector from "../kernel/orphan-detector.js";
import * as SnapshotManager from "../state/snapshot-manager.js";
import * as LifecycleHooks from "./lifecycle-hooks/index.js";
import * as PendingQueue from "../kernel/pending-queue/index.js";
import * as TemplateRegistry from "./template-registry/index.js";
import * as Transitions from "../ui/transitions/index.js";
import * as FocusManager from "../ui/focus-manager.js";
import * as ZIndexManager from "../ui/zindex-manager.js";
import * as _MetricsCollector from "../telemetry/metrics-collector.js";
const MetricsCollector = _MetricsCollector;
import * as ErrorBoundary from "./error-boundary/index.js";
import * as DebugPanel from "../devtools/debug-panel.js";
import * as Lifecycle from "./lifecycle.js";
const VERSION = "2.7.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer";
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 300;
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(prefix, ...args);
    return;
  }
  if (_debug()) logger.debug?.(prefix, ...args);
};
const _retryState = { appShellAttempts: 0, appShellConnected: false, contextProviderAttempts: 0, contextProviderConnected: false, kernelIntegrated: false };
let _ops = { open: null, close: null };
const injectOps = (ops) => {
  _ops = ops;
};
const setupAppShellIntegration = (attempt = 1) => {
  _retryState.appShellAttempts = attempt;
  const appShell = _getPort("appShell");
  const hasAppShell = appShell && (appShell.getContainer || appShell.adapter?.getContainer);
  if (!hasAppShell) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      return new Promise((r) => setTimeout(r, RETRY_BASE_DELAY * attempt)).then(() => setupAppShellIntegration(attempt + 1));
    }
    Tracker.trackEvent("appshell:using-fallback", { attempts: attempt });
    return Promise.resolve(false);
  }
  try {
    const container = appShell.getContainer?.("overlay") || appShell.adapter?.getContainer?.("overlay");
    if (container) {
      _retryState.appShellConnected = true;
      return Promise.resolve(container);
    }
  } catch (error) {
    _log("error", "AppShell error:", error.message);
  }
  return Promise.resolve(false);
};
const syncWithContextProvider = () => {
  const cp = _getPort("contextProvider");
  if (!cp?.set) return false;
  try {
    const stack = Store.getStack();
    cp.set("ui.overlay.stack", stack);
    cp.set("ui.overlay.hasBlocking", _hasBlockingCheck());
    cp.set("ui.overlay.activeCount", stack.length);
    return true;
  } catch (e) {
    return false;
  }
};
const _hasBlockingCheck = () => {
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  return stack.some((id) => {
    const o = overlays[id];
    return o?.config?.blocking === true || o?.type === "modal";
  });
};
const setupContextProviderIntegration = (attempt = 1) => {
  _retryState.contextProviderAttempts = attempt;
  const cp = _getPort("contextProvider");
  if (!cp?.set) {
    if (attempt < MAX_RETRY_ATTEMPTS) return new Promise((r) => setTimeout(r, RETRY_BASE_DELAY * attempt)).then(() => setupContextProviderIntegration(attempt + 1));
    return Promise.resolve(false);
  }
  try {
    syncWithContextProvider();
    _retryState.contextProviderConnected = true;
    return Promise.resolve(true);
  } catch (error) {
    return Promise.resolve(false);
  }
};
const setupKernelIntegration = (runtimeContext = {}) => {
  try {
    const result = OverlayKernel.init({ eventBus: runtimeContext.eventBus || _getPort("eventBus"), ports: Ports.snapshot(), applicationKernel: runtimeContext.applicationKernel || window?.ApplicationKernel, permissionsGuard: runtimeContext.permissionsGuard || window?.PermissionsGuard });
    if (result.ok) {
      _retryState.kernelIntegrated = result.data?.runtimeIntegrated || false;
      return true;
    }
    return false;
  } catch (error) {
    _log("error", "Kernel error:", error.message);
    return false;
  }
};
const setupSprint1 = () => {
  AutoCleanup.inject({ store: Store, closeOverlay: (id, r) => _ops.close(id, r), eventBus: _getPort("eventBus") });
  AutoCleanup.enable({ scanInterval: 3e4 });
};
const setupSprint2 = () => {
  CircuitBreaker.inject({ eventBus: _getPort("eventBus") });
  OrphanDetector.inject({ store: Store, closeOverlay: (id, r) => _ops.close(id, r), eventBus: _getPort("eventBus") });
  OrphanDetector.enableAutoScan(6e4);
  SnapshotManager.inject({ store: Store, openOverlay: (d, o) => _ops.open(d, o), closeOverlay: (id, r) => _ops.close(id, r) });
  LifecycleHooks.inject({ logger: _getPort("logger") });
};
const setupSprint3 = () => {
  PendingQueue.inject({ openOverlay: (d, o) => _ops.open(d, { ...o, bypassQueue: true }), canOpenOverlay: (t, o) => OverlayKernel.canOpenOverlay(t, o), eventBus: _getPort("eventBus") });
  PendingQueue.startAutoProcess(5e3);
  TemplateRegistry.inject({ schemaValidator: SchemaValidator });
};
const setupSprint4 = (overlayLayerRef) => {
  MetricsCollector.enable();
  ErrorBoundary.inject({ logger: _getPort("logger"), metricsCollector: MetricsCollector });
  DebugPanel.inject({ overlayLayer: overlayLayerRef });
  DebugPanel.init(overlayLayerRef);
  _log("info", "Sprint 4 modules initialized");
};
const retryAppShellIntegration = () => {
  _retryState.appShellConnected = false;
  return setupAppShellIntegration(1);
};
const retryContextProviderIntegration = () => {
  _retryState.contextProviderConnected = false;
  return setupContextProviderIntegration(1);
};
const retryAllIntegrations = () => Promise.all([retryAppShellIntegration(), retryContextProviderIntegration()]).then((r) => ({ appShell: !!r[0], contextProvider: r[1], kernel: _retryState.kernelIntegrated }));
const createInit = (overlayLayerRef) => {
  return (runtimeContext = {}) => {
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
    return setupAppShellIntegration().then((container) => {
      const opts = container ? { parentElement: container } : {};
      return Lifecycle.init(opts);
    }).then((result) => setupContextProviderIntegration().then(() => {
      Store.subscribe(() => syncWithContextProvider());
      return result;
    }));
  };
};
const shutdown = () => {
  _retryState.appShellConnected = false;
  _retryState.contextProviderConnected = false;
  _retryState.kernelIntegrated = false;
  AutoCleanup.disable();
  OrphanDetector.disableAutoScan();
  PendingQueue.stopAutoProcess();
  FocusManager.release();
  Transitions.cancelAll();
  DebugPanel.destroy();
  OverlayKernel.shutdown("overlay-layer-shutdown");
  Lifecycle.unmount();
  Store.clear();
  return true;
};
const reset = () => {
  Store.clear();
  Lifecycle.unmount();
  RateLimiter.reset();
  CircuitBreaker.reset();
  SnapshotManager.clearSnapshots();
  PendingQueue.clear();
  ZIndexManager.reset();
  MetricsCollector.reset();
  ErrorBoundary.clearErrors();
  return true;
};
const isInitialized = () => Lifecycle.isInitialized();
export {
  MAX_RETRY_ATTEMPTS,
  MODULE_ID,
  Ports,
  RETRY_BASE_DELAY,
  VERSION,
  _getPort,
  _initPorts,
  _log,
  _retryState,
  createInit,
  getPorts,
  injectOps,
  injectPorts,
  isInitialized,
  reset,
  retryAllIntegrations,
  retryAppShellIntegration,
  retryContextProviderIntegration,
  setupAppShellIntegration,
  setupContextProviderIntegration,
  setupKernelIntegration,
  setupSprint1,
  setupSprint2,
  setupSprint3,
  setupSprint4,
  shutdown,
  syncWithContextProvider
};
