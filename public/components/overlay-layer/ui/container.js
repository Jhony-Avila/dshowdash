const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "overlay-layer-container";
let _container = null;
const CONTAINER_ID = "overlay-layer-container";
function create() {
  if (_container) return _container;
  _container = document.createElement("div");
  _container.id = CONTAINER_ID;
  _container.className = "overlay-layer-container";
  _container.setAttribute("aria-live", "polite");
  document.body.appendChild(_container);
  return _container;
}
function get() {
  return _container || document.getElementById(CONTAINER_ID);
}
function destroy() {
  if (_container?.parentNode) _container.parentNode.removeChild(_container);
  _container = null;
}
function exists() {
  return !!get();
}
function healthCheck() {
  const checks = { containerExists: exists(), inDOM: !!document.getElementById(CONTAINER_ID) };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, containerId: CONTAINER_ID, exists: exists(), timestamp: Date.now() };
}
var container_default = { create, get, destroy, exists, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  create,
  container_default as default,
  destroy,
  exists,
  get,
  healthCheck,
  info
};
