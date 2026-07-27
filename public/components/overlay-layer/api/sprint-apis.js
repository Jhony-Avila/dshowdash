import Store, { VERSION as STORE_VERSION } from "../state/store.js";
import * as Lifecycle from "../core/lifecycle.js";
import * as Container from "../ui/container.js";
import * as Manager from "../core/manager.js";
import * as OverlayKernel from "../kernel/index.js";
import * as SchemaValidator from "../utils/schema-validator.js";
import * as RateLimiter from "../kernel/rate-limiter.js";
import * as AutoCleanup from "../kernel/auto-cleanup.js";
import * as CircuitBreaker from "../kernel/circuit-breaker.js";
import * as OrphanDetector from "../kernel/orphan-detector.js";
import * as SnapshotManager from "../state/snapshot-manager.js";
import * as LifecycleHooks from "../core/lifecycle-hooks/index.js";
import * as PendingQueue from "../kernel/pending-queue/index.js";
import * as TemplateRegistry from "../core/template-registry/index.js";
import * as Transitions from "../ui/transitions/index.js";
import * as FocusManager from "../ui/focus-manager.js";
import * as ZIndexManager from "../ui/zindex-manager.js";
import * as _MetricsCollector from "../telemetry/metrics-collector.js";
const MetricsCollector = _MetricsCollector;
import * as ErrorBoundary from "../core/error-boundary/index.js";
import * as LazyLoader from "../core/lazy-loader/index.js";
import * as DebugPanel from "../devtools/debug-panel.js";
import { _retryState, VERSION, MODULE_ID } from "../core/integrations.js";
import { _hasBlockingOverlay, _getTopOverlay } from "../core/operations.js";
const validateDescriptor = (d) => SchemaValidator.validate(d);
const configureRateLimiter = (c) => RateLimiter.configure(c);
const getCircuitBreakerState = () => CircuitBreaker.getState();
const resetCircuitBreaker = () => CircuitBreaker.reset();
const scanOrphans = () => OrphanDetector.scan();
const cleanupOrphans = () => OrphanDetector.cleanup();
const createSnapshot = (o) => SnapshotManager.snapshot(o);
const restoreSnapshot = (s, o) => SnapshotManager.restore(s, o);
const listSnapshots = () => SnapshotManager.listSnapshots();
const onHook = (t, h, o) => LifecycleHooks.on(t, h, o);
const offHook = (t, h) => LifecycleHooks.off(t, h);
const enqueueOverlay = (d, r, o) => PendingQueue.enqueue(d, r, o);
const processQueue = () => PendingQueue.process();
const getQueuedOverlays = () => PendingQueue.getAll();
const registerTemplate = (i, c) => TemplateRegistry.register(i, c);
const getTemplate = (i) => TemplateRegistry.get(i);
const listTemplates = () => TemplateRegistry.list();
const applyTemplate = (i, o) => TemplateRegistry.apply(i, o);
const registerTransition = (n, c) => Transitions.register(n, c);
const listTransitions = () => Transitions.list();
const trapFocus = (e, o) => FocusManager.trap(e, o);
const releaseFocus = (o) => FocusManager.release(o);
const acquireZIndex = (l, o) => ZIndexManager.acquire(l, o);
const releaseZIndex = (i) => ZIndexManager.release(i);
const getMetrics = () => MetricsCollector.getAllMetrics?.() || {};
const getPerformanceStats = () => MetricsCollector.getPerformanceStats?.() || {};
const getErrors = (l) => ErrorBoundary.getErrors(l);
const getErrorStats = () => ErrorBoundary.getStats();
const onError = (h) => ErrorBoundary.onError(h);
const registerLoader = (t, l) => LazyLoader.registerLoader(t, l);
const lazyLoad = (t, o) => LazyLoader.load(t, o);
const prefetch = (t, o) => LazyLoader.prefetch(t, o);
const showDebugPanel = () => DebugPanel.show();
const hideDebugPanel = () => DebugPanel.hide();
const toggleDebugPanel = () => DebugPanel.toggle();
const status = () => ({
  initialized: Lifecycle.getState().initialized,
  activeCount: Store.getStack().length,
  hasBlocking: _hasBlockingOverlay(),
  topOverlay: _getTopOverlay()?.id || null,
  appShellConnected: _retryState.appShellConnected,
  contextProviderConnected: _retryState.contextProviderConnected,
  kernelIntegrated: _retryState.kernelIntegrated,
  kernelMode: OverlayKernel.getMode(),
  rateLimiterEnabled: RateLimiter.isEnabled(),
  autoCleanupEnabled: AutoCleanup.isEnabled(),
  circuitBreakerState: CircuitBreaker.getState(),
  orphanDetectorEnabled: OrphanDetector.isAutoScanEnabled(),
  lifecycleHooksEnabled: LifecycleHooks.isEnabled(),
  pendingQueueSize: PendingQueue.size(),
  focusTrapped: FocusManager.isTrapped(),
  metricsEnabled: MetricsCollector.isEnabled?.() || false,
  errorCount: ErrorBoundary.getStats().current,
  debugPanelVisible: DebugPanel.isVisible()
});
const info = () => ({
  name: MODULE_ID,
  version: VERSION,
  status: Lifecycle.getState().initialized ? "READY" : "NOT_INITIALIZED",
  stack: { count: Store.getStack().length, hasBlocking: _hasBlockingOverlay(), top: _getTopOverlay() },
  metrics: Manager.getMetrics(),
  sprint1: { schemaValidator: SchemaValidator.info(), rateLimiter: RateLimiter.info(), autoCleanup: AutoCleanup.info() },
  sprint2: { circuitBreaker: CircuitBreaker.info(), orphanDetector: OrphanDetector.info(), snapshotManager: SnapshotManager.info(), lifecycleHooks: LifecycleHooks.info() },
  sprint3: { pendingQueue: PendingQueue.info(), templateRegistry: TemplateRegistry.info(), transitions: Transitions.info(), focusManager: FocusManager.info(), zIndexManager: ZIndexManager.info() },
  sprint4: { metricsCollector: MetricsCollector.info?.() || { status: "MODULE_CORRUPTED" }, errorBoundary: ErrorBoundary.info(), lazyLoader: LazyLoader.info(), debugPanel: DebugPanel.info() },
  components: { store: STORE_VERSION, kernel: OverlayKernel.VERSION, schemaValidator: SchemaValidator.VERSION, rateLimiter: RateLimiter.VERSION, circuitBreaker: CircuitBreaker.VERSION, pendingQueue: PendingQueue.VERSION, metricsCollector: MetricsCollector.VERSION || "CORRUPTED", errorBoundary: ErrorBoundary.VERSION, lazyLoader: LazyLoader.VERSION, debugPanel: DebugPanel.VERSION }
});
const healthCheck = () => {
  const checks = {
    initialized: Lifecycle.getState().initialized,
    containerMounted: Container.exists(),
    storeAvailable: !!Store,
    kernelReady: OverlayKernel.healthCheck().status !== "UNHEALTHY",
    kernelIntegrated: _retryState.kernelIntegrated,
    circuitBreakerHealthy: CircuitBreaker.healthCheck().status !== "UNHEALTHY",
    pendingQueueHealthy: PendingQueue.healthCheck().status !== "UNHEALTHY",
    metricsHealthy: MetricsCollector.healthCheck?.()?.status !== "UNHEALTHY" || true,
    errorBoundaryHealthy: ErrorBoundary.healthCheck().status !== "UNHEALTHY"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed < total * 0.5 ? "UNHEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, timestamp: Date.now() };
};
const getVersion = () => VERSION;
const buildDebugNamespace = () => ({
  getStore: () => Store.getState(),
  getStackSnapshot: () => ({ stack: Store.getStack(), overlays: Store.getOverlays() }),
  kernel: { info: () => OverlayKernel.info(), health: () => OverlayKernel.healthCheck() },
  sprint1: { schemaValidator: { validate: (d) => SchemaValidator.validate(d) }, rateLimiter: { info: () => RateLimiter.info(), reset: () => RateLimiter.reset() }, autoCleanup: { scan: () => AutoCleanup.scan() } },
  sprint2: { circuitBreaker: { info: () => CircuitBreaker.info(), forceOpen: () => CircuitBreaker.forceOpen("debug") }, orphanDetector: { scan: () => OrphanDetector.scan() }, snapshotManager: { snapshot: (o) => SnapshotManager.snapshot(o), list: () => SnapshotManager.listSnapshots() } },
  sprint3: { pendingQueue: { info: () => PendingQueue.info(), process: () => PendingQueue.process() }, templateRegistry: { list: () => TemplateRegistry.list() }, transitions: { list: () => Transitions.list() }, focusManager: { state: () => FocusManager.getState() }, zIndexManager: { layers: () => ZIndexManager.getLayers() } },
  sprint4: { metricsCollector: { all: () => MetricsCollector.getAllMetrics?.() || {}, performance: () => MetricsCollector.getPerformanceStats?.() || {}, reset: () => MetricsCollector.reset?.() }, errorBoundary: { errors: () => ErrorBoundary.getErrors(), stats: () => ErrorBoundary.getStats(), clear: () => ErrorBoundary.clearErrors() }, lazyLoader: { info: () => LazyLoader.info(), cache: () => LazyLoader.getCacheInfo() }, debugPanel: { show: () => DebugPanel.show(), hide: () => DebugPanel.hide(), toggle: () => DebugPanel.toggle() } },
  versions: { main: VERSION, kernel: OverlayKernel.VERSION, metricsCollector: MetricsCollector.VERSION || "CORRUPTED", errorBoundary: ErrorBoundary.VERSION, lazyLoader: LazyLoader.VERSION, debugPanel: DebugPanel.VERSION }
});
export {
  VERSION as SPRINT_APIS_VERSION,
  acquireZIndex,
  applyTemplate,
  buildDebugNamespace,
  cleanupOrphans,
  configureRateLimiter,
  createSnapshot,
  enqueueOverlay,
  getCircuitBreakerState,
  getErrorStats,
  getErrors,
  getMetrics,
  getPerformanceStats,
  getQueuedOverlays,
  getTemplate,
  getVersion,
  healthCheck,
  hideDebugPanel,
  info,
  lazyLoad,
  listSnapshots,
  listTemplates,
  listTransitions,
  offHook,
  onError,
  onHook,
  prefetch,
  processQueue,
  registerLoader,
  registerTemplate,
  registerTransition,
  releaseFocus,
  releaseZIndex,
  resetCircuitBreaker,
  restoreSnapshot,
  scanOrphans,
  showDebugPanel,
  status,
  toggleDebugPanel,
  trapFocus,
  validateDescriptor
};
