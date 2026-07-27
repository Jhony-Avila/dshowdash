import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { SHELL_EVENTS as GLOBAL_SHELL_EVENTS } from "/core/runtime/events/catalog/shell.events.js";
const VERSION = "4.3.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-telemetry";
const NAMESPACE = "app-shell";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}
let _traceId = null;
let _correlationId = null;
function _ensureTraceId() {
  if (!_traceId) _traceId = _generateId();
  return _traceId;
}
let _metrics = {
  events: 0,
  errors: 0,
  healthChecks: 0,
  warnings: 0,
  performance: []
};
const SHELL_EVENTS = Object.freeze({
  MOUNT_START: "shell:mount:start",
  MOUNT_SUCCESS: "shell:mount:success",
  MOUNT_FAILED: "shell:mount:failed",
  UNMOUNT_START: "shell:unmount:start",
  UNMOUNT_SUCCESS: "shell:unmount:success",
  LIFECYCLE_CHANGE: "shell:lifecycle:change",
  READY: "shell:ready",
  ERROR: "shell:error",
  WARNING: "shell:warning",
  HEALTH_CHECK: "shell:health:check",
  HEALTH_DEGRADED: "shell:health:degraded",
  REGION_ACCESS: "shell:region:access",
  ADAPTER_CONNECT: "shell:adapter:connect",
  ADAPTER_DISCONNECT: "shell:adapter:disconnect",
  PERFORMANCE: "shell:performance"
});
function _createStructuredLog(level, event, context) {
  context = context || {};
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    component: NAMESPACE,
    moduleId: MODULE_ID,
    event,
    traceId: _ensureTraceId(),
    correlationId: _correlationId,
    context,
    version: VERSION
  };
}
function setCorrelationId(id) {
  _correlationId = id;
}
function getTraceId() {
  return _ensureTraceId();
}
function resetTraceId() {
  _traceId = _generateId();
  return _traceId;
}
function trackShellEvent(event, context) {
  _initPorts();
  _metrics.events++;
  const log = _createStructuredLog("info", event, context);
  try {
    const telemetry = _getPort("telemetry");
    const logger = _getPort("logger");
    if (telemetry && telemetry.event) {
      telemetry.event(`${NAMESPACE}:${event}`, log);
    } else if (logger && logger.info) {
      logger.info(`[${NAMESPACE}] ${event}`, log);
    }
  } catch (e) {
  }
  return log;
}
function trackError(error, context) {
  _initPorts();
  _metrics.errors++;
  context = context || {};
  const log = _createStructuredLog("error", SHELL_EVENTS.ERROR, {
    error: error.message || String(error),
    stack: error.stack || null,
    code: error.code || "UNKNOWN",
    ...context
  });
  try {
    const logger = _getPort("logger");
    const telemetry = _getPort("telemetry");
    if (logger && logger.error) logger.error(`[${NAMESPACE}] Error`, log);
    if (telemetry && telemetry.error) telemetry.error(`${NAMESPACE}:error`, log);
  } catch (e) {
  }
  return log;
}
function trackWarning(message, context) {
  _initPorts();
  _metrics.warnings++;
  context = context || {};
  const log = _createStructuredLog("warn", SHELL_EVENTS.WARNING, { message, ...context });
  try {
    const logger = _getPort("logger");
    if (logger && logger.warn) logger.warn(`[${NAMESPACE}] ${message}`, log);
  } catch (e) {
  }
  return log;
}
function trackPerformance(label, startTime, context) {
  context = context || {};
  const duration = Math.round(performance.now() - startTime);
  const log = _createStructuredLog("info", SHELL_EVENTS.PERFORMANCE, { label, duration, ...context });
  _metrics.performance.push({ label, duration, timestamp: Date.now() });
  if (_metrics.performance.length > 50) _metrics.performance = _metrics.performance.slice(-50);
  try {
    trackShellEvent("shell:performance", { label, duration, ...context });
  } catch (e) {
  }
  return { duration, log };
}
function trackHealthCheck(result) {
  _initPorts();
  _metrics.healthChecks++;
  const log = _createStructuredLog(
    result.status === "HEALTHY" ? "info" : "warn",
    SHELL_EVENTS.HEALTH_CHECK,
    { status: result.status, score: result.score, issues: result.issues ? result.issues.length : 0, checks: result.checks }
  );
  try {
    const eventBus = _getPort("eventBus");
    if (result.status !== "HEALTHY" && eventBus && eventBus.emit) {
      eventBus.emit(GLOBAL_SHELL_EVENTS.HEALTH_REPORT, log);
    }
  } catch (e) {
  }
  return log;
}
function trackAdapterEvent(adapterName, event, context) {
  context = context || {};
  const fullEvent = `adapter:${adapterName}:${event}`;
  return trackShellEvent(fullEvent, { adapter: adapterName, ...context });
}
function getMetrics() {
  const portsSnapshot = Ports.snapshot();
  return {
    ..._metrics,
    traceId: _traceId,
    correlationId: _correlationId,
    performanceAvg: _metrics.performance.length > 0 ? Math.round(_metrics.performance.reduce((a, b) => a + b.duration, 0) / _metrics.performance.length) : null,
    portsStatus: { initialized: portsSnapshot._initialized }
  };
}
function getPerformanceMetrics() {
  return _metrics.performance.slice();
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const checks = {
    tracking: true,
    hasTraceId: !!_traceId,
    lowErrorRate: _metrics.events === 0 || _metrics.errors / _metrics.events < 0.1,
    portsInitialized: portsSnapshot._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    events: Object.keys(SHELL_EVENTS),
    traceId: _traceId,
    correlationId: _correlationId,
    metrics: getMetrics(),
    performanceMetrics: getPerformanceMetrics(),
    portsStatus: { initialized: portsSnapshot._initialized },
    timestamp: Date.now()
  };
}
var tracker_default = {
  trackShellEvent,
  trackError,
  trackWarning,
  trackPerformance,
  trackHealthCheck,
  trackAdapterEvent,
  setCorrelationId,
  getTraceId,
  resetTraceId,
  getMetrics,
  getPerformanceMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  SHELL_EVENTS,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  SHELL_EVENTS,
  VERSION,
  tracker_default as default,
  getMetrics,
  getPerformanceMetrics,
  getPorts,
  getTraceId,
  healthCheck,
  info,
  injectPorts,
  resetTraceId,
  setCorrelationId,
  trackAdapterEvent,
  trackError,
  trackHealthCheck,
  trackPerformance,
  trackShellEvent,
  trackWarning
};
