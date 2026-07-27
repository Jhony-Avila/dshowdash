import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.1.0-P17WI";
const MODULE_ID = "notification-manager-state";
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
const _state = { notifications: [], unreadCount: 0 };
function getState() {
  return Object.assign({}, _state, { notifications: _state.notifications.slice() });
}
function setNotifications(list) {
  _initPorts();
  _state.notifications = list;
  _state.unreadCount = list.filter((n) => !n.read).length;
}
function getUnreadCount() {
  return _state.unreadCount;
}
function healthCheck() {
  const checks = { hasState: true, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 2 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/2`,
    checks,
    notificationCount: _state.notifications.length,
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    notificationCount: _state.notifications.length,
    unreadCount: _state.unreadCount,
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}
var state_default = { getState, setNotifications, getUnreadCount, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  state_default as default,
  getPorts,
  getState,
  getUnreadCount,
  healthCheck,
  info,
  injectPorts,
  setNotifications
};
