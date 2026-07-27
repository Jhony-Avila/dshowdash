const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "network-monitor-detector";
let _listeners = [];
function isOnline() {
  return navigator.onLine ?? true;
}
function watch(callback) {
  const onlineHandler = () => callback(true);
  const offlineHandler = () => callback(false);
  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", offlineHandler);
  _listeners.push({ onlineHandler, offlineHandler });
  return () => unwatch(onlineHandler, offlineHandler);
}
function unwatch(onlineHandler, offlineHandler) {
  window.removeEventListener("online", onlineHandler);
  window.removeEventListener("offline", offlineHandler);
  _listeners = _listeners.filter((l) => l.onlineHandler !== onlineHandler);
}
function unwatchAll() {
  for (let i = 0; i < _listeners.length; i++) {
    window.removeEventListener("online", _listeners[i].onlineHandler);
    window.removeEventListener("offline", _listeners[i].offlineHandler);
  }
  _listeners = [];
}
function healthCheck() {
  const checks = { navigatorOnlineSupported: "onLine" in navigator };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, online: isOnline(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, online: isOnline(), listenerCount: _listeners.length, timestamp: Date.now() };
}
var detector_default = { isOnline, watch, unwatch, unwatchAll, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  detector_default as default,
  healthCheck,
  info,
  isOnline,
  unwatch,
  unwatchAll,
  watch
};
