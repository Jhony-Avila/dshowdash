const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "sw-controller-store";
let _state = { registered: false, registration: null, updateAvailable: false, status: "idle" };
let _subscribers = [];
const _validStatuses = ["idle", "registering", "registered", "error"];
function getState() {
  return { ..._state };
}
function setRegistered(val, reg = null) {
  _state.registered = val;
  _state.registration = reg;
  _notify();
}
function setUpdateAvailable(val) {
  _state.updateAvailable = val;
  _notify();
}
function setStatus(status) {
  _state.status = status;
  _notify();
}
function subscribe(fn) {
  if (typeof fn === "function") _subscribers.push(fn);
  return () => {
    _subscribers = _subscribers.filter((s) => s !== fn);
  };
}
function _notify() {
  _subscribers.forEach((s) => {
    try {
      s(_state);
    } catch (e) {
    }
  });
}
function healthCheck() {
  const checks = { hasState: true, validStatus: _validStatuses.includes(_state.status) };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, swStatus: _state.status, registered: _state.registered, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, registered: _state.registered, updateAvailable: _state.updateAvailable, status: _state.status, timestamp: Date.now() };
}
const swStore = { getState, setRegistered, setUpdateAvailable, setStatus, subscribe, healthCheck, info };
var store_default = { getState, setRegistered, setUpdateAvailable, setStatus, subscribe, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  store_default as default,
  getState,
  healthCheck,
  info,
  setRegistered,
  setStatus,
  setUpdateAvailable,
  subscribe,
  swStore
};
