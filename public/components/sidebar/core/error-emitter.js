import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { MODULE_ID as SIDEBAR_MODULE_ID } from "./constants.js";
const VERSION = "5.9.0-P02-UNIFIED-BUS";
const MODULE_ID = "sidebar-error-emitter";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
let _degradedComponents = [];
let _lastError = null;
let _status = "idle";
let _logger = null;
let _tracker = null;
let _metrics = { degradedEmits: 0, errorEmits: 0, resets: 0, busSource: null };
function setDependencies(logger, tracker) {
  _logger = logger;
  _tracker = tracker;
}
function _getEventBus() {
  const bus = _getPort("eventBus") || _getPort("eventBusGlobal");
  if (bus) {
    _metrics.busSource = _getPort("eventBus") ? "eventBus" : "eventBusGlobal";
  }
  return bus;
}
function emitDegraded(component, error) {
  _metrics.degradedEmits++;
  try {
    if (!_degradedComponents.includes(component)) {
      _degradedComponents.push(component);
    }
    _status = "degraded";
    _lastError = error;
    const bus = _getEventBus();
    if (bus?.emit) {
      bus.emit(SIDEBAR_EVENTS.DEGRADED, {
        source: SIDEBAR_MODULE_ID,
        component,
        error,
        degradedComponents: _degradedComponents,
        timestamp: Date.now()
      });
    }
    _logger?.warn?.(`Component degraded: ${component}`, { error });
    _tracker?.trackError?.(error, { component, phase: "degraded" });
  } catch {
  }
}
function emitError(error, context = {}) {
  _metrics.errorEmits++;
  try {
    _status = "error";
    _lastError = error;
    const bus = _getEventBus();
    if (bus?.emit) {
      bus.emit(SIDEBAR_EVENTS.ERROR, {
        source: SIDEBAR_MODULE_ID,
        error: error?.message || error,
        context,
        timestamp: Date.now()
      });
    }
    _logger?.error?.("Sidebar error:", { error, context });
    _tracker?.trackError?.(error, context);
  } catch {
  }
}
function getStatus() {
  return _status;
}
function setStatus(status) {
  _status = status;
}
function getDegradedComponents() {
  return [..._degradedComponents];
}
function getLastError() {
  return _lastError;
}
function resetErrorState() {
  _metrics.resets++;
  _degradedComponents = [];
  _lastError = null;
  _status = "idle";
}
function isDegraded() {
  return _status === "degraded" || _degradedComponents.length > 0;
}
function isError() {
  return _status === "error";
}
function getMetrics() {
  return {
    ..._metrics,
    degradedCount: _degradedComponents.length,
    currentStatus: _status,
    hasError: !!_lastError
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    status: _status,
    degradedComponents: [..._degradedComponents],
    lastError: _lastError,
    metrics: getMetrics(),
    busSource: _metrics.busSource
  };
}
function healthCheck() {
  const bus = _getEventBus();
  return {
    status: _status === "error" ? "ERROR" : _status === "degraded" ? "DEGRADED" : "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    checks: {
      currentStatus: _status,
      degradedCount: _degradedComponents.length,
      hasError: !!_lastError,
      hasEventBus: !!bus
    },
    metrics: getMetrics(),
    busSource: _metrics.busSource
  };
}
var error_emitter_default = {
  setDependencies,
  emitDegraded,
  emitError,
  getStatus,
  setStatus,
  getDegradedComponents,
  getLastError,
  resetErrorState,
  isDegraded,
  isError,
  healthCheck,
  info,
  getMetrics,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  error_emitter_default as default,
  emitDegraded,
  emitError,
  getDegradedComponents,
  getLastError,
  getMetrics,
  getPorts,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  isDegraded,
  isError,
  resetErrorState,
  setDependencies,
  setStatus
};
