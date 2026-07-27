import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { performanceStore as _performanceStore } from "./state/store.js";
import { MetricsCollector as _MetricsCollector } from "./core/collector.js";
import { PerformanceAnalyzer as _PerformanceAnalyzer } from "./core/analyzer.js";
import { PerformanceLifecycle as _PerformanceLifecycle } from "./core/lifecycle.js";
const performanceStore = _performanceStore;
const MetricsCollector = _MetricsCollector;
const PerformanceAnalyzer = _PerformanceAnalyzer;
const PerformanceLifecycle = _PerformanceLifecycle;
import { trackPerformanceEvent, getEventLog, getRecentEvents } from "./telemetry/tracker.js";
import { formatDuration, calculatePercentile, getMemoryUsage, getFPS } from "./utils/helpers.js";
const VERSION = "1.8.0-P2-ENTERPRISE";
const MODULE_ID = "performance-monitor";
const PERFORMANCE_EVENTS = { METRIC_RECORDED: "performance:metric:recorded", THRESHOLD_EXCEEDED: "performance:threshold:exceeded" };
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let orchestratorCleanups = [];
let globalStateCleanups = [];
const setupGlobalStateIntegration = () => {
  const globalState = _getPort("globalState");
  if (!globalState) return;
  const unsubscribeDebug = globalState.subscribe((debugMode) => {
    if (debugMode) MetricsCollector.enableDetailedTracking();
    else MetricsCollector.disableDetailedTracking();
    trackPerformanceEvent("performance:global-state:debug-mode", { debugMode });
  }, "flags.debugMode");
  globalStateCleanups.push(unsubscribeDebug);
  trackPerformanceEvent("performance:global-state:connected");
};
const cleanupGlobalStateIntegration = () => {
  globalStateCleanups.forEach((cleanup) => {
    if (typeof cleanup === "function") cleanup();
  });
  globalStateCleanups = [];
};
const setupOrchestratorIntegration = () => {
  const eventBus = _getPort("eventBus");
  if (!eventBus) return;
  const unsubscribe = performanceStore.subscribe(({ action }) => {
    const eb = _getPort("eventBus");
    if (!eb?.emit) return;
    if (action === "metric-recorded") eb.emit(PERFORMANCE_EVENTS.METRIC_RECORDED, { timestamp: Date.now() });
    else if (action === "threshold-exceeded") eb.emit(PERFORMANCE_EVENTS.THRESHOLD_EXCEEDED, { metrics: performanceStore.getExceededThresholds(), timestamp: Date.now() });
  });
  orchestratorCleanups.push(unsubscribe);
  trackPerformanceEvent("performance:orchestrator:connected");
};
const cleanupOrchestratorIntegration = () => {
  orchestratorCleanups.forEach((cleanup) => {
    if (typeof cleanup === "function") cleanup();
  });
  orchestratorCleanups = [];
};
const PerformanceMonitor = {
  version: VERSION,
  name: MODULE_ID,
  PERFORMANCE_EVENTS,
  init: (options = {}) => {
    trackPerformanceEvent("performance:api:init:called");
    _initPorts();
    return PerformanceLifecycle.init(options).then((result) => {
      setupGlobalStateIntegration();
      setupOrchestratorIntegration();
      return result;
    });
  },
  shutdown: () => {
    trackPerformanceEvent("performance:api:shutdown:called");
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    return PerformanceLifecycle.shutdown();
  },
  reset: () => {
    trackPerformanceEvent("performance:api:reset:called");
    return PerformanceLifecycle.reset();
  },
  mark: (name) => MetricsCollector.mark(name),
  measure: (name, startMark, endMark) => MetricsCollector.measure(name, startMark, endMark),
  clearMarks: () => MetricsCollector.clearMarks(),
  clearMeasures: () => MetricsCollector.clearMeasures(),
  recordMetric: (name, value) => MetricsCollector.record(name, value),
  getMetric: (name) => performanceStore.getMetric(name),
  getAllMetrics: () => performanceStore.getAllMetrics(),
  startTimer: (name) => MetricsCollector.startTimer(name),
  stopTimer: (name) => MetricsCollector.stopTimer(name),
  getTimerDuration: (name) => MetricsCollector.getTimerDuration(name),
  getFPS: () => getFPS(),
  getMemoryUsage: () => getMemoryUsage(),
  getNavigationTiming: () => PerformanceAnalyzer.getNavigationTiming(),
  getResourceTiming: () => PerformanceAnalyzer.getResourceTiming(),
  setThreshold: (metric, value) => performanceStore.setThreshold(metric, value),
  checkThresholds: () => PerformanceAnalyzer.checkThresholds(),
  getExceededThresholds: () => performanceStore.getExceededThresholds(),
  generateReport: () => PerformanceAnalyzer.generateReport(),
  exportMetrics: () => performanceStore.exportMetrics(),
  subscribe: (listener) => performanceStore.subscribe(listener),
  status: () => PerformanceLifecycle.getStatus(),
  isInitialized: () => PerformanceLifecycle.isInitialized(),
  getVersion: () => VERSION,
  injectPorts,
  getPorts,
  info: () => ({ name: MODULE_ID, version: VERSION, status: PerformanceLifecycle.getStatus(), orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0, portsInitialized: Ports.isInitialized() }),
  healthCheck: () => {
    const checks = { initialized: PerformanceLifecycle.isInitialized(), storeAvailable: !!performanceStore, collectorAvailable: !!MetricsCollector, analyzerAvailable: !!PerformanceAnalyzer, lifecycleAvailable: !!PerformanceLifecycle, globalStateConnected: globalStateCleanups.length > 0, orchestratorConnected: orchestratorCleanups.length > 0, portsInitialized: Ports.isInitialized() };
    const issues = [];
    let score = 0;
    for (const [key, value] of Object.entries(checks)) {
      if (value) score++;
      else issues.push(key);
    }
    const maxScore = Object.keys(checks).length;
    return { status: score === maxScore ? "HEALTHY" : score >= maxScore - 2 ? "DEGRADED" : "UNHEALTHY", score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  },
  utils: { formatDuration, calculatePercentile, getMemoryUsage, getFPS },
  debug: { getEventLog, getRecentEvents, getStore: () => performanceStore.toJSON() }
};
if (typeof window !== "undefined") {
  if (!isStrict()) {
    window.PerformanceMonitor = PerformanceMonitor;
    trackPerformanceEvent("performance:global:exposed");
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.PerformanceMonitor" });
  }
  window.__dev = window.__dev || {};
  window.__dev.performanceMonitor = { MODULE_ID, VERSION, healthCheck: PerformanceMonitor.healthCheck, info: PerformanceMonitor.info, status: PerformanceMonitor.status, getAllMetrics: PerformanceMonitor.getAllMetrics, getFPS: PerformanceMonitor.getFPS, getMemoryUsage: PerformanceMonitor.getMemoryUsage, debug: PerformanceMonitor.debug };
}
var performance_monitor_default = PerformanceMonitor;
export {
  MODULE_ID,
  MetricsCollector,
  PERFORMANCE_EVENTS,
  PerformanceAnalyzer,
  PerformanceLifecycle,
  PerformanceMonitor,
  VERSION,
  performance_monitor_default as default,
  getPorts,
  injectPorts,
  performanceStore
};
