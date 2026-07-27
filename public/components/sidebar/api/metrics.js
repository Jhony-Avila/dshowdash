const VERSION = "1.0.0";
const MODULE_ID = "sidebar-api-metrics";
const _metrics = {
  toggleAttempts: 0,
  toggleSuccess: 0,
  toggleBlocked: 0,
  syncFailures: 0,
  fallbackUsed: 0,
  atomicTransitions: 0,
  lastToggleAt: null
};
function increment(key) {
  if (key in _metrics && typeof _metrics[key] === "number") {
    _metrics[key]++;
  }
}
function set(key, value) {
  if (key in _metrics) {
    _metrics[key] = value;
  }
}
function get(key) {
  return _metrics[key];
}
function getAll() {
  return { ..._metrics };
}
function reset() {
  _metrics.toggleAttempts = 0;
  _metrics.toggleSuccess = 0;
  _metrics.toggleBlocked = 0;
  _metrics.syncFailures = 0;
  _metrics.fallbackUsed = 0;
  _metrics.atomicTransitions = 0;
  _metrics.lastToggleAt = null;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getAll()
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      atomicTransitions: _metrics.atomicTransitions,
      syncFailures: _metrics.syncFailures
    },
    metrics: getAll()
  };
}
var metrics_default = { increment, set, get, getAll, reset, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  metrics_default as default,
  get,
  getAll,
  healthCheck,
  increment,
  info,
  reset,
  set
};
