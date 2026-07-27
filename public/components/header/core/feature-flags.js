import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/feature-flags";
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
let _initialized = false;
let _flags = {};
const _metrics = {
  initCalls: 0,
  flagChecks: 0,
  flagChanges: 0
};
const DEFAULT_FLAGS = {
  routerIntegration: true,
  globalStateIntegration: true,
  eventBusIntegration: true,
  appShellIntegration: true,
  telemetryEnabled: true,
  circuitBreakerEnabled: true,
  pollingEnabled: true,
  accessibilityEnabled: true,
  selfHealingEnabled: true,
  gracefulDegradationEnabled: true,
  pluginSystemEnabled: false,
  lazyLoadingEnabled: true,
  serviceWorkerEnabled: false,
  configValidation: true
};
function _log(level, msg, data) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, msg, data || "");
  else if (level === "warn" && logger.warn) logger.warn(prefix, msg, data || "");
  else if (level === "info" && logger.info) logger.info(prefix, msg, data || "");
}
function init(customFlags) {
  _metrics.initCalls++;
  if (_initialized) {
    return;
  }
  _initPorts();
  _flags = Object.assign({}, DEFAULT_FLAGS, customFlags || {});
  _initialized = true;
  _log("info", `FeatureFlags inicializado com ${Object.keys(_flags).length} flags`);
}
function isEnabled(flagName) {
  _metrics.flagChecks++;
  if (!_initialized) {
    init();
  }
  return _flags[flagName] === true;
}
function isDisabled(flagName) {
  return !isEnabled(flagName);
}
function setFlag(flagName, value) {
  if (!_initialized) init();
  const oldValue = _flags[flagName];
  _flags[flagName] = !!value;
  if (oldValue !== _flags[flagName]) {
    _metrics.flagChanges++;
    _log("info", `Flag alterada: ${flagName} = ${_flags[flagName]}`);
    const eventBus = _getPort("eventBus");
    if (eventBus && eventBus.emit) {
      eventBus.emit("header:feature-flag:changed", { flag: flagName, value: _flags[flagName], oldValue });
    }
  }
}
function getFlag(flagName) {
  if (!_initialized) init();
  return _flags[flagName];
}
function getAll() {
  if (!_initialized) init();
  return Object.assign({}, _flags);
}
function getEnabled() {
  if (!_initialized) init();
  const enabled = [];
  Object.keys(_flags).forEach((key) => {
    if (_flags[key] === true) enabled.push(key);
  });
  return enabled;
}
function getDisabled() {
  if (!_initialized) init();
  const disabled = [];
  Object.keys(_flags).forEach((key) => {
    if (_flags[key] === false) disabled.push(key);
  });
  return disabled;
}
function reset() {
  _flags = Object.assign({}, DEFAULT_FLAGS);
  _log("info", "FeatureFlags resetado para defaults");
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const checks = {
    initialized: _initialized,
    hasFlags: Object.keys(_flags).length > 0,
    portsInitialized: Ports.isInitialized(),
    storageAccessible: true
  };
  const issues = [];
  if (!_initialized) issues.push("Nao inicializado");
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    issues,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    flags: getAll(),
    enabledCount: getEnabled().length,
    disabledCount: getDisabled().length,
    metrics: getMetrics(),
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}
var feature_flags_default = {
  VERSION,
  MODULE_ID,
  init,
  isEnabled,
  isDisabled,
  setFlag,
  getFlag,
  getAll,
  getEnabled,
  getDisabled,
  reset,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  feature_flags_default as default,
  getAll,
  getDisabled,
  getEnabled,
  getFlag,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isDisabled,
  isEnabled,
  reset,
  setFlag
};
