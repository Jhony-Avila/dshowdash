const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "nav-route-repository";
let _routes = /* @__PURE__ */ new Map();
let _metrics = { registered: 0, lookups: 0, errors: 0 };
function register(path, config) {
  try {
    _routes.set(path, { ...config, registeredAt: Date.now() });
    _metrics.registered++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function get(path) {
  _metrics.lookups++;
  return _routes.get(path) || null;
}
function match(path) {
  _metrics.lookups++;
  if (_routes.has(path)) return _routes.get(path);
  for (const [routePath, config] of _routes) {
    if (path.startsWith(routePath.replace("*", ""))) return config;
  }
  return null;
}
function getAll() {
  return Object.fromEntries(_routes);
}
function has(path) {
  return _routes.has(path);
}
function remove(path) {
  return _routes.delete(path);
}
function clear() {
  _routes.clear();
}
function getMetrics() {
  return { ..._metrics, count: _routes.size };
}
function healthCheck() {
  return {
    status: _metrics.errors === 0 ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { routeCount: _routes.size, noErrors: _metrics.errors === 0 },
    metrics: getMetrics()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    routeCount: _routes.size,
    registeredRoutes: Array.from(_routes.keys()),
    metrics: getMetrics()
  };
}
var NavRouteRepository_default = { register, get, match, getAll, has, remove, clear, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clear,
  NavRouteRepository_default as default,
  get,
  getAll,
  getMetrics,
  has,
  healthCheck,
  info,
  match,
  register,
  remove
};
