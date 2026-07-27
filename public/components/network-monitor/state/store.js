const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "network-monitor-store";
let _state = { online: true, connectionType: "unknown", downlink: null, rtt: null, lastCheck: null };
let _subscribers = [];
function getState() {
  return { ..._state };
}
function setOnline(val) {
  _state.online = val;
  _state.lastCheck = Date.now();
  _notify();
}
function updateConnection(info2) {
  Object.assign(_state, info2, { lastCheck: Date.now() });
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
  const checks = { hasState: true, recentCheck: _state.lastCheck && Date.now() - _state.lastCheck < 6e4 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, online: _state.online, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, online: _state.online, connectionType: _state.connectionType, timestamp: Date.now() };
}
var store_default = { getState, setOnline, updateConnection, subscribe, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  store_default as default,
  getState,
  healthCheck,
  info,
  setOnline,
  subscribe,
  updateConnection
};
