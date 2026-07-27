// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.8.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.performance-monitor
// PURPOSE: Performance monitoring with metrics collection and analysis
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes performance monitor
// @contract SHUTDOWN - shutdown() shuts down performance monitor
// @contract RESET - reset() resets performance monitor
// @contract MARK - mark(name) creates performance mark
// @contract MEASURE - measure(name, startMark, endMark) creates measurement
// @contract RECORD_METRIC - recordMetric(name, value) records metric
// @contract GET_METRIC - getMetric(name) gets metric value
// @contract GET_ALL_METRICS - getAllMetrics() returns all metrics
// @contract START_TIMER - startTimer(name) starts timer
// @contract STOP_TIMER - stopTimer(name) stops timer
// @contract SUBSCRIBE - subscribe(listener) subscribes to changes
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: performanceStore, MetricsCollector, PerformanceAnalyzer, PerformanceLifecycle
// PROVIDES: PerformanceMonitor, performanceStore, MetricsCollector, PerformanceAnalyzer,
//           PerformanceLifecycle, injectPorts, getPorts, VERSION, MODULE_ID, PERFORMANCE_EVENTS
// @changelog v1.8.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.7.0-STRICT-MODE: Strict mode integration
// @changelog v1.6.0-ENTERPRISE: ES6 modernization
// @changelog v1.5.2-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { performanceStore as _performanceStore } from './state/store.js';
import { MetricsCollector as _MetricsCollector } from './core/collector.js';
import { PerformanceAnalyzer as _PerformanceAnalyzer } from './core/analyzer.js';
import { PerformanceLifecycle as _PerformanceLifecycle } from './core/lifecycle.js';

const performanceStore = _performanceStore as any;
const MetricsCollector = _MetricsCollector as any;
const PerformanceAnalyzer = _PerformanceAnalyzer as any;
const PerformanceLifecycle = _PerformanceLifecycle as any;
import { trackPerformanceEvent, getEventLog, getRecentEvents } from './telemetry/tracker.js';
import { formatDuration, calculatePercentile, getMemoryUsage, getFPS } from './utils/helpers.js';

export const VERSION = '1.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'performance-monitor';

const PERFORMANCE_EVENTS = { METRIC_RECORDED: 'performance:metric:recorded', THRESHOLD_EXCEEDED: 'performance:threshold:exceeded' };

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let orchestratorCleanups: (() => void)[] = [];
let globalStateCleanups: (() => void)[] = [];

const setupGlobalStateIntegration = () => {
  const globalState = _getPort('globalState');
  if (!globalState) return;
  const unsubscribeDebug = globalState.subscribe((debugMode: unknown) => {
    if (debugMode) MetricsCollector.enableDetailedTracking();
    else MetricsCollector.disableDetailedTracking();
    trackPerformanceEvent('performance:global-state:debug-mode', { debugMode });
  }, 'flags.debugMode');
  globalStateCleanups.push(unsubscribeDebug);
  trackPerformanceEvent('performance:global-state:connected');
};

const cleanupGlobalStateIntegration = () => { globalStateCleanups.forEach((cleanup) => { if (typeof cleanup === 'function') cleanup(); }); globalStateCleanups = []; };

const setupOrchestratorIntegration = () => {
  const eventBus = _getPort('eventBus');
  if (!eventBus) return;
  const unsubscribe = performanceStore.subscribe(({ action }: { action: string }) => {
    const eb = _getPort('eventBus');
    if (!eb?.emit) return;
    if (action === 'metric-recorded') eb.emit(PERFORMANCE_EVENTS.METRIC_RECORDED, { timestamp: Date.now() });
    else if (action === 'threshold-exceeded') eb.emit(PERFORMANCE_EVENTS.THRESHOLD_EXCEEDED, { metrics: performanceStore.getExceededThresholds(), timestamp: Date.now() });
  });
  orchestratorCleanups.push(unsubscribe);
  trackPerformanceEvent('performance:orchestrator:connected');
};

const cleanupOrchestratorIntegration = () => { orchestratorCleanups.forEach((cleanup) => { if (typeof cleanup === 'function') cleanup(); }); orchestratorCleanups = []; };

const PerformanceMonitor = {
  version: VERSION, name: MODULE_ID, PERFORMANCE_EVENTS,
  init: (options = {}) => {
    trackPerformanceEvent('performance:api:init:called');
    _initPorts();
    return PerformanceLifecycle.init(options).then((result: unknown) => { setupGlobalStateIntegration(); setupOrchestratorIntegration(); return result; });
  },
  shutdown: () => { trackPerformanceEvent('performance:api:shutdown:called'); cleanupGlobalStateIntegration(); cleanupOrchestratorIntegration(); return PerformanceLifecycle.shutdown(); },
  reset: () => { trackPerformanceEvent('performance:api:reset:called'); return PerformanceLifecycle.reset(); },
  mark: (name: string) => MetricsCollector.mark(name),
  measure: (name: string, startMark: string, endMark: string) => MetricsCollector.measure(name, startMark, endMark),
  clearMarks: () => MetricsCollector.clearMarks(),
  clearMeasures: () => MetricsCollector.clearMeasures(),
  recordMetric: (name: string, value: number) => MetricsCollector.record(name, value),
  getMetric: (name: string) => performanceStore.getMetric(name),
  getAllMetrics: () => performanceStore.getAllMetrics(),
  startTimer: (name: string) => MetricsCollector.startTimer(name),
  stopTimer: (name: string) => MetricsCollector.stopTimer(name),
  getTimerDuration: (name: string) => MetricsCollector.getTimerDuration(name),
  getFPS: () => getFPS(),
  getMemoryUsage: () => getMemoryUsage(),
  getNavigationTiming: () => PerformanceAnalyzer.getNavigationTiming(),
  getResourceTiming: () => PerformanceAnalyzer.getResourceTiming(),
  setThreshold: (metric: string, value: number) => performanceStore.setThreshold(metric, value),
  checkThresholds: () => PerformanceAnalyzer.checkThresholds(),
  getExceededThresholds: () => performanceStore.getExceededThresholds(),
  generateReport: () => PerformanceAnalyzer.generateReport(),
  exportMetrics: () => performanceStore.exportMetrics(),
  subscribe: (listener: (state: unknown) => void) => performanceStore.subscribe(listener),
  status: () => PerformanceLifecycle.getStatus(),
  isInitialized: () => PerformanceLifecycle.isInitialized(),
  getVersion: () => VERSION,
  injectPorts, getPorts,
  info: () => ({ name: MODULE_ID, version: VERSION, status: PerformanceLifecycle.getStatus(), orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0, portsInitialized: Ports.isInitialized() }),
  healthCheck: () => {
    const checks = { initialized: PerformanceLifecycle.isInitialized(), storeAvailable: !!performanceStore, collectorAvailable: !!MetricsCollector, analyzerAvailable: !!PerformanceAnalyzer, lifecycleAvailable: !!PerformanceLifecycle, globalStateConnected: globalStateCleanups.length > 0, orchestratorConnected: orchestratorCleanups.length > 0, portsInitialized: Ports.isInitialized() };
    const issues = [];
    let score = 0;
    for (const [key, value] of Object.entries(checks)) { if (value) score++; else issues.push(key); }
    const maxScore = Object.keys(checks).length;
    return { status: score === maxScore ? 'HEALTHY' : score >= maxScore - 2 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  },
  utils: { formatDuration, calculatePercentile, getMemoryUsage, getFPS },
  debug: { getEventLog, getRecentEvents, getStore: () => performanceStore.toJSON() }
};

if (typeof window !== 'undefined') {
  if (!isStrict()) {
    (window as any).PerformanceMonitor = PerformanceMonitor;
    trackPerformanceEvent('performance:global:exposed');
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.PerformanceMonitor' });
  }
  // DevTools sempre permitido
  (window as any).__dev = (window as any).__dev || {};
  (window as any).__dev.performanceMonitor = { MODULE_ID, VERSION, healthCheck: PerformanceMonitor.healthCheck, info: PerformanceMonitor.info, status: PerformanceMonitor.status, getAllMetrics: PerformanceMonitor.getAllMetrics, getFPS: PerformanceMonitor.getFPS, getMemoryUsage: PerformanceMonitor.getMemoryUsage, debug: PerformanceMonitor.debug };
}

export default PerformanceMonitor;
export { PerformanceMonitor, PERFORMANCE_EVENTS, performanceStore, MetricsCollector, PerformanceAnalyzer, PerformanceLifecycle };
