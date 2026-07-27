const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "notification-manager-store";
let _state = { notifications: [], config: { maxVisible: 5 } };
let _subscribers = [];
function getState() {
  return { ..._state };
}
function getNotifications() {
  return [..._state.notifications];
}
function addNotification(n) {
  if (!n?.id) return false;
  _state.notifications.push(n);
  _notify();
  return true;
}
function removeNotification(id) {
  _state.notifications = _state.notifications.filter((n) => n.id !== id);
  _notify();
  return true;
}
function clear() {
  _state.notifications = [];
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
  const checks = { hasState: true, notOverloaded: _state.notifications.length < 50 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, notificationCount: _state.notifications.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, notificationCount: _state.notifications.length, subscriberCount: _subscribers.length, timestamp: Date.now() };
}
var store_default = { getState, getNotifications, addNotification, removeNotification, clear, subscribe, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addNotification,
  clear,
  store_default as default,
  getNotifications,
  getState,
  healthCheck,
  info,
  removeNotification,
  subscribe
};
