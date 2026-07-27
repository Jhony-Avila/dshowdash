import { createCorePorts } from "/core/runtime/ports-profiles.js";
const FEATURE_ID = "template";
const VERSION = "1.0.0";
const SCOPE = "nav-rail";
const CATEGORY = "navigation";
const MODULE_ID = `navrail/features/${FEATURE_ID}`;
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
let _state = {
  initialized: false,
  container: null,
  eventBus: null,
  registry: null,
  config: null,
  handlers: []
};
function init({ container, eventBus, registry, config }) {
  if (_state.initialized) {
    _log("warn", "Feature already initialized");
    return;
  }
  _state.container = container;
  _state.eventBus = eventBus;
  _state.registry = registry;
  _state.config = config || {};
  _bindHandlers();
  _state.initialized = true;
  _log("info", "Feature initialized");
  _emitEvent("feature:ready", { featureId: FEATURE_ID });
}
function destroy() {
  _unbindHandlers();
  _state = {
    initialized: false,
    container: null,
    eventBus: null,
    registry: null,
    config: null,
    handlers: []
  };
  _log("info", "Feature destroyed");
}
function _bindHandlers() {
}
function _unbindHandlers() {
  _state.handlers.forEach(({ event, handler }) => {
    _state.eventBus?.off(event, handler);
  });
  _state.handlers = [];
}
function _emitEvent(eventName, data = {}) {
  const payload = {
    type: eventName,
    timestamp: Date.now(),
    source: "navrail",
    featureId: FEATURE_ID,
    ...data
  };
  _state.eventBus?.emit(eventName, payload);
}
function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    hasContainer: !!_state.container,
    hasEventBus: !!_state.eventBus,
    handlersActive: _state.handlers.length,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(
    (v) => typeof v === "boolean" ? v : v > 0
  ).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "ERROR",
    version: VERSION,
    moduleId: MODULE_ID,
    featureId: FEATURE_ID,
    checks,
    timestamp: Date.now()
  };
}
function info() {
  return {
    featureId: FEATURE_ID,
    version: VERSION,
    scope: SCOPE,
    category: CATEGORY,
    moduleId: MODULE_ID,
    initialized: _state.initialized,
    handlersCount: _state.handlers.length,
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}
var template_default = {
  FEATURE_ID,
  VERSION,
  SCOPE,
  CATEGORY,
  init,
  destroy,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
export {
  CATEGORY,
  FEATURE_ID,
  MODULE_ID,
  SCOPE,
  VERSION,
  template_default as default,
  destroy,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts
};
