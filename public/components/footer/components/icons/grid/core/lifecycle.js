const MODULE_ID = "footer-icon-grid-lifecycle";
const VERSION = "1.1.0-ENTERPRISE";
let _phase = "idle", _container = null, _mountCount = 0;
const Lifecycle = { getPhase() {
  return _phase;
}, isReady() {
  return _phase === "ready" || _phase === "mounted";
}, isMounted() {
  return _phase === "mounted";
}, setInitializing() {
  _phase = "initializing";
}, setReady() {
  _phase = "ready";
}, setMounted(c) {
  _phase = "mounted";
  _container = c;
  _mountCount++;
}, setUnmounting() {
  _phase = "unmounting";
}, setDestroyed() {
  _phase = "destroyed";
  _container = null;
}, reset() {
  _phase = "idle";
  _container = null;
}, getContainer() {
  return _container;
}, info() {
  return { phase: _phase, isMounted: this.isMounted(), mountCount: _mountCount };
} };
function getMetrics() {
  return { phase: _phase, mountCount: _mountCount, hasContainer: !!_container };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, lifecycle: Lifecycle.info(), metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { phase: _phase }, metrics: getMetrics() };
}
var lifecycle_default = { ...Lifecycle, getMetrics, info, healthCheck, MODULE_ID, VERSION };
export {
  Lifecycle,
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getMetrics,
  healthCheck,
  info
};
