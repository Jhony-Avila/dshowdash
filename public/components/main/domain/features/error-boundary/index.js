import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
const MODULE_ID = "main.feature.error-boundary";
const VERSION = "1.0.0-ENTERPRISE";
const ERROR_LEVELS = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical"
});
const MAX_ERROR_HISTORY = 100;
const ERROR_RATE_WINDOW_MS = 6e4;
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
let _enabled = false;
let _cleanups = [];
let _errorHistory = [];
let _errorCountBySource = /* @__PURE__ */ new Map();
let _errorHandlers = [];
let _metrics = {
  inits: 0,
  errorsCaptured: 0,
  errorsReported: 0,
  errorsByLevel: { info: 0, warning: 0, error: 0, critical: 0 },
  errorsBySource: {},
  lastError: null,
  lastErrorTime: null
};
function _createErrorEntry(error, source, level, context = {}) {
  return {
    id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    level: level || ERROR_LEVELS.ERROR,
    source: source || "unknown",
    message: error?.message || String(error),
    stack: error?.stack || null,
    context,
    reported: false
  };
}
function _addToHistory(entry) {
  _errorHistory.unshift(entry);
  if (_errorHistory.length > MAX_ERROR_HISTORY) {
    _errorHistory.pop();
  }
}
function _updateMetrics(entry) {
  _metrics.errorsCaptured++;
  _metrics.errorsByLevel[entry.level] = (_metrics.errorsByLevel[entry.level] || 0) + 1;
  _metrics.errorsBySource[entry.source] = (_metrics.errorsBySource[entry.source] || 0) + 1;
  _metrics.lastError = entry.message;
  _metrics.lastErrorTime = entry.timestamp;
  const count = _errorCountBySource.get(entry.source) || 0;
  _errorCountBySource.set(entry.source, count + 1);
}
function _notifyHandlers(entry) {
  for (const handler of _errorHandlers) {
    try {
      handler(entry);
    } catch (e) {
      console.debug("%c[ERROR]%c [ErrorBoundary] Handler error:", "color:#ef4444;font-weight:bold", "color:inherit", e.message || e);
    }
  }
}
function _reportToTelemetry(entry) {
  const telemetry = _getPort("telemetry");
  if (telemetry?.trackError) {
    telemetry.trackError("error-boundary:captured", {
      errorId: entry.id,
      level: entry.level,
      source: entry.source,
      message: entry.message
    });
    entry.reported = true;
    _metrics.errorsReported++;
  }
}
function _emitEvent(entry) {
  const eb = _getPort("eventBus");
  if (eb?.emit) {
    eb.emit("error-boundary:error", { source: MODULE_ID, error: entry });
  }
}
function _handleGlobalError(event) {
  captureError(
    event.error || event.message,
    "window.onerror",
    ERROR_LEVELS.ERROR,
    { filename: event.filename, lineno: event.lineno, colno: event.colno }
  );
}
function _handleUnhandledRejection(event) {
  captureError(
    event.reason,
    "unhandledrejection",
    ERROR_LEVELS.ERROR,
    { type: "promise" }
  );
}
function init(options = {}) {
  if (_enabled) {
    return { ok: true, alreadyInitialized: true };
  }
  try {
    _initPorts();
    _metrics.inits++;
    if (typeof window !== "undefined") {
      window.addEventListener("error", _handleGlobalError);
      window.addEventListener("unhandledrejection", _handleUnhandledRejection);
      _cleanups.push(() => {
        window.removeEventListener("error", _handleGlobalError);
        window.removeEventListener("unhandledrejection", _handleUnhandledRejection);
      });
    }
    const eb = _getPort("eventBus");
    if (eb?.on) {
      const mainErrorHandler = (data) => {
        captureError(data.error || data.message, "main.error", ERROR_LEVELS.ERROR, data);
      };
      if (MAIN_EVENTS?.INIT_ERROR) {
        eb.on(MAIN_EVENTS.INIT_ERROR, mainErrorHandler);
        _cleanups.push(() => eb.off?.(MAIN_EVENTS.INIT_ERROR, mainErrorHandler));
      }
      if (MAIN_EVENTS?.NAVIGATION_ERROR) {
        eb.on(MAIN_EVENTS.NAVIGATION_ERROR, mainErrorHandler);
        _cleanups.push(() => eb.off?.(MAIN_EVENTS.NAVIGATION_ERROR, mainErrorHandler));
      }
    }
    _enabled = true;
    return { ok: true, version: VERSION };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
function destroy() {
  for (const fn of _cleanups) {
    try {
      fn();
    } catch (e) {
    }
  }
  _cleanups = [];
  _errorHandlers = [];
  _enabled = false;
  return { ok: true };
}
const cleanup = destroy;
function captureError(error, source, level, context) {
  if (!_enabled) return { ok: false, error: "Not initialized" };
  const entry = _createErrorEntry(error, source || "manual", level || ERROR_LEVELS.ERROR, context || {});
  _addToHistory(entry);
  _updateMetrics(entry);
  _notifyHandlers(entry);
  _reportToTelemetry(entry);
  _emitEvent(entry);
  return { ok: true, errorId: entry.id };
}
function captureFeatureError(featureId, error, context) {
  return captureError(error, `feature:${featureId}`, ERROR_LEVELS.ERROR, context);
}
function onError(handler) {
  if (typeof handler !== "function") return () => {
  };
  _errorHandlers.push(handler);
  return () => {
    const idx = _errorHandlers.indexOf(handler);
    if (idx > -1) _errorHandlers.splice(idx, 1);
  };
}
function getErrorHistory(options) {
  let errors = _errorHistory.slice();
  if (options?.level) errors = errors.filter((e) => e.level === options.level);
  if (options?.source) errors = errors.filter((e) => e.source === options.source);
  if (options?.limit) errors = errors.slice(0, options.limit);
  return errors;
}
function getErrorCountBySource() {
  return Object.fromEntries(_errorCountBySource);
}
function getErrorRate() {
  const now = Date.now();
  const recentErrors = _errorHistory.filter((e) => now - e.timestamp < ERROR_RATE_WINDOW_MS);
  return { errorsPerMinute: recentErrors.length, windowMs: ERROR_RATE_WINDOW_MS };
}
function clearHistory() {
  _errorHistory = [];
  _errorCountBySource.clear();
  return { ok: true };
}
function getMetrics() {
  return Object.assign({}, _metrics, { historySize: _errorHistory.length, errorRate: getErrorRate() });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, errorLevels: ERROR_LEVELS, metrics: getMetrics() };
}
function healthCheck() {
  const errorRate = getErrorRate();
  const highErrorRate = errorRate.errorsPerMinute > 10;
  const checks = { enabled: _enabled, hasEventBus: !!_getPort("eventBus"), lowErrorRate: !highErrorRate };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_enabled) status = "NOT_INITIALIZED";
  else if (highErrorRate) status = "DEGRADED";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    errorRate,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
var error_boundary_default = {
  MODULE_ID,
  VERSION,
  ERROR_LEVELS,
  init,
  destroy,
  cleanup,
  captureError,
  captureFeatureError,
  onError,
  getErrorHistory,
  getErrorCountBySource,
  getErrorRate,
  clearHistory,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  captureError,
  captureFeatureError,
  cleanup,
  clearHistory,
  error_boundary_default as default,
  destroy,
  getErrorCountBySource,
  getErrorHistory,
  getErrorRate,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  onError
};
