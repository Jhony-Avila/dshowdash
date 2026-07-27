import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { MountCircuitBreaker } from "./circuit-breaker.js";
import * as CircuitBreakerAPI from "./circuit-breaker-api.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/circuit-breaker-unified";
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
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, args.join(" "));
  else if (level === "warn" && logger.warn) logger.warn(prefix, args.join(" "));
  else if (level === "info" && logger.info) logger.info(prefix, args.join(" "));
};
const BREAKER_TYPES = { MOUNT: "mount", API: "api" };
let _mountBreaker = null;
const _metrics = { mountChecks: 0, apiChecks: 0, lastCheckAt: null };
function init(options) {
  options = options || {};
  _initPorts();
  if (!_mountBreaker) {
    _mountBreaker = new MountCircuitBreaker({
      // @ts-expect-error TS migration - TS2322
      maxFailures: options.mountMaxFailures || 3,
      // @ts-expect-error TS migration - TS2322
      resetTimeout: options.mountResetTimeout || 6e4
    });
  }
  _log("info", "Circuit breaker unificado inicializado");
}
function getMountBreaker() {
  if (!_mountBreaker) {
    _mountBreaker = new MountCircuitBreaker();
  }
  return _mountBreaker;
}
function checkMount() {
  _metrics.mountChecks++;
  _metrics.lastCheckAt = Date.now();
  return getMountBreaker().check();
}
function recordMountFailure() {
  return getMountBreaker().recordFailure();
}
function resetMount() {
  return getMountBreaker().reset();
}
function getMountStatus() {
  return getMountBreaker().getStatus();
}
function getApiBreaker(componentName, options) {
  _metrics.apiChecks++;
  _metrics.lastCheckAt = Date.now();
  return CircuitBreakerAPI.getBreaker(componentName, options);
}
function hasApiBreaker(componentName) {
  return CircuitBreakerAPI.hasBreaker(componentName);
}
function removeApiBreaker(componentName) {
  return CircuitBreakerAPI.removeBreaker(componentName);
}
function getAllApiBreakers() {
  return CircuitBreakerAPI.getAllBreakers();
}
function getOpenApiBreakers() {
  return CircuitBreakerAPI.getOpenBreakers();
}
function resetAllApi() {
  return CircuitBreakerAPI.resetAll();
}
function getBreaker(type, componentName, options) {
  if (type === BREAKER_TYPES.MOUNT) {
    return getMountBreaker();
  }
  if (type === BREAKER_TYPES.API) {
    return getApiBreaker(componentName, options);
  }
  throw new Error(`Tipo de circuit breaker invalido: ${type}`);
}
function canExecute(type, componentName) {
  if (type === BREAKER_TYPES.MOUNT) {
    try {
      checkMount();
      return true;
    } catch (e) {
      return false;
    }
  }
  if (type === BREAKER_TYPES.API && componentName) {
    const breaker = getApiBreaker(componentName);
    return breaker.canExecute();
  }
  return true;
}
function execute(type, componentName, fn, fallback) {
  if (type === BREAKER_TYPES.MOUNT) {
    try {
      checkMount();
      return Promise.resolve(fn());
    } catch (e) {
      if (fallback) return Promise.resolve(fallback(e));
      return Promise.reject(e);
    }
  }
  if (type === BREAKER_TYPES.API && componentName) {
    const breaker = getApiBreaker(componentName);
    return breaker.execute(fn, fallback);
  }
  return Promise.resolve(fn());
}
function resetAll() {
  resetMount();
  resetAllApi();
  _log("info", "Todos os circuit breakers resetados");
}
function getAllStatus() {
  const mountStatus = _mountBreaker ? getMountStatus() : null;
  const apiBreakers = getAllApiBreakers();
  const openApiBreakers = getOpenApiBreakers();
  return {
    mount: mountStatus,
    api: {
      total: Object.keys(apiBreakers).length,
      open: openApiBreakers.length,
      breakers: apiBreakers
    },
    openBreakers: {
      mount: mountStatus && mountStatus.isOpen ? 1 : 0,
      api: openApiBreakers.length,
      total: (mountStatus && mountStatus.isOpen ? 1 : 0) + openApiBreakers.length,
      apiNames: openApiBreakers
    }
  };
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    // @ts-expect-error TS migration - TS2349
    mountMetrics: _mountBreaker ? _mountBreaker.getMetrics() : null,
    apiMetrics: CircuitBreakerAPI.getGlobalMetrics()
  });
}
function resetMetrics() {
  _metrics.mountChecks = 0;
  _metrics.apiChecks = 0;
  _metrics.lastCheckAt = null;
  if (_mountBreaker) _mountBreaker.resetMetrics();
}
function healthCheck() {
  const mountHealth = _mountBreaker ? _mountBreaker.healthCheck() : { status: "UNKNOWN" };
  const apiHealth = CircuitBreakerAPI.healthCheck();
  const checks = {
    mountHealthy: mountHealth.status === "HEALTHY" || mountHealth.status === "DEGRADED",
    apiHealthy: apiHealth.status === "HEALTHY" || apiHealth.status === "DEGRADED",
    noMountOpen: !_mountBreaker || !_mountBreaker.isOpen,
    fewApiOpen: CircuitBreakerAPI.getOpenBreakers().length <= 2,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    mountHealth,
    apiHealth,
    openBreakers: getAllStatus().openBreakers,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    types: BREAKER_TYPES,
    status: getAllStatus(),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}
const CircuitBreakerAPIClass = CircuitBreakerAPI.CircuitBreakerAPI;
var circuit_breaker_unified_default = {
  VERSION,
  MODULE_ID,
  BREAKER_TYPES,
  init,
  getMountBreaker,
  checkMount,
  recordMountFailure,
  resetMount,
  getMountStatus,
  getApiBreaker,
  hasApiBreaker,
  removeApiBreaker,
  getAllApiBreakers,
  getOpenApiBreakers,
  resetAllApi,
  getBreaker,
  canExecute,
  execute,
  resetAll,
  getAllStatus,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
export {
  BREAKER_TYPES,
  CircuitBreakerAPIClass,
  MODULE_ID,
  MountCircuitBreaker,
  VERSION,
  canExecute,
  checkMount,
  circuit_breaker_unified_default as default,
  execute,
  getAllApiBreakers,
  getAllStatus,
  getApiBreaker,
  getBreaker,
  getMetrics,
  getMountBreaker,
  getMountStatus,
  getOpenApiBreakers,
  getPorts,
  hasApiBreaker,
  healthCheck,
  info,
  init,
  injectPorts,
  recordMountFailure,
  removeApiBreaker,
  resetAll,
  resetAllApi,
  resetMetrics,
  resetMount
};
