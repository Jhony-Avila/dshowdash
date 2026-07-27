const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer-registry";
let _registry = {};
function register(type, config) {
  if (!type) return false;
  _registry[type] = config;
  return true;
}
function unregister(type) {
  if (!_registry[type]) return false;
  delete _registry[type];
  return true;
}
function get(type) {
  return _registry[type] || null;
}
function has(type) {
  return !!_registry[type];
}
function list() {
  return Object.keys(_registry);
}
function clear() {
  _registry = {};
}
function size() {
  return Object.keys(_registry).length;
}
function healthCheck() {
  const checks = { registryExists: true, hasEntries: size() > 0 };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, registeredTypes: list(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, size: size(), registeredTypes: list(), timestamp: Date.now() };
}
var registry_default = { register, unregister, get, has, list, clear, size, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clear,
  registry_default as default,
  get,
  has,
  healthCheck,
  info,
  list,
  register,
  size,
  unregister
};
