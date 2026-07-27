const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "overlay-layer-store";
let _state = { stack: [], overlays: {}, config: { maxStack: 10 } };
let _subscribers = [];
function getState() {
  return { ..._state };
}
function getStack() {
  return [..._state.stack];
}
function getOverlay(id) {
  return _state.overlays[id] || null;
}
function getOverlays() {
  return { ..._state.overlays };
}
function getConfig() {
  return { ..._state.config };
}
function addOverlay(overlay) {
  if (!overlay?.id) return false;
  _state.overlays[overlay.id] = overlay;
  if (!_state.stack.includes(overlay.id)) _state.stack.push(overlay.id);
  _notify();
  return true;
}
function removeOverlay(id) {
  if (!_state.overlays[id]) return false;
  delete _state.overlays[id];
  _state.stack = _state.stack.filter((i) => i !== id);
  _notify();
  return true;
}
function updateOverlayRuntime(id, runtime) {
  if (!_state.overlays[id]) return false;
  _state.overlays[id] = { ..._state.overlays[id], runtime: { ..._state.overlays[id].runtime, ...runtime } };
  _notify();
  return true;
}
function clear() {
  _state = { stack: [], overlays: {}, config: _state.config };
  _notify();
}
function subscribe(fn) {
  if (typeof fn === "function") _subscribers.push(fn);
  return () => {
    _subscribers = _subscribers.filter((s) => s !== fn);
  };
}
function _notify() {
  _subscribers.forEach((fn) => {
    try {
      fn(_state);
    } catch (e) {
    }
  });
}
function healthCheck() {
  const checks = { hasState: !!_state, stackHealthy: _state.stack.length < _state.config.maxStack, noOrphans: _state.stack.every((id) => !!_state.overlays[id]) };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, stackSize: _state.stack.length, overlayCount: Object.keys(_state.overlays).length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, stackSize: _state.stack.length, overlayCount: Object.keys(_state.overlays).length, subscriberCount: _subscribers.length, config: getConfig(), timestamp: Date.now() };
}
var store_default = { getState, getStack, getOverlay, getOverlays, getConfig, addOverlay, removeOverlay, updateOverlayRuntime, clear, subscribe, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addOverlay,
  clear,
  store_default as default,
  getConfig,
  getOverlay,
  getOverlays,
  getStack,
  getState,
  healthCheck,
  info,
  removeOverlay,
  subscribe,
  updateOverlayRuntime
};
