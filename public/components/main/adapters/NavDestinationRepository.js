const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "nav-destination-repository";
let _destinations = /* @__PURE__ */ new Map();
let _metrics = { registered: 0, lookups: 0, errors: 0 };
function register(id, destination) {
  try {
    _destinations.set(id, { ...destination, registeredAt: Date.now() });
    _metrics.registered++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function get(id) {
  _metrics.lookups++;
  return _destinations.get(id) || null;
}
function getAll() {
  return Object.fromEntries(_destinations);
}
function has(id) {
  return _destinations.has(id);
}
function remove(id) {
  return _destinations.delete(id);
}
function clear() {
  _destinations.clear();
}
function getMetrics() {
  return { ..._metrics, count: _destinations.size };
}
function healthCheck() {
  return {
    status: _metrics.errors === 0 ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { destinationCount: _destinations.size, noErrors: _metrics.errors === 0 },
    metrics: getMetrics()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    destinationCount: _destinations.size,
    registeredDestinations: Array.from(_destinations.keys()),
    metrics: getMetrics()
  };
}
var NavDestinationRepository_default = { register, get, getAll, has, remove, clear, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clear,
  NavDestinationRepository_default as default,
  get,
  getAll,
  getMetrics,
  has,
  healthCheck,
  info,
  register,
  remove
};
