import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-pipedrive/ui/notifications";
let _debug = false;
const _notifications = [];
const _metrics = { shown: 0, hidden: 0, lastShownAt: null };
function show(message, options = {}) {
  const notification = { id: `notif-${Date.now()}`, message, type: options.type || "info", duration: options.duration || 3e3, timestamp: Date.now() };
  _notifications.push(notification);
  _metrics.shown++;
  _metrics.lastShownAt = Date.now();
  if (Number(notification.duration) > 0) setTimeout(() => hide(notification.id), Number(notification.duration));
  return notification;
}
function hide(id) {
  const idx = _notifications.findIndex((n) => n.id === id);
  if (idx !== -1) {
    _notifications.splice(idx, 1);
    _metrics.hidden++;
    return true;
  }
  return false;
}
function getActive() {
  return [..._notifications];
}
function clearAll() {
  _notifications.length = 0;
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getMetrics() {
  return { ..._metrics, active: _notifications.length };
}
function resetMetrics() {
  _metrics.shown = 0;
  _metrics.hidden = 0;
  _metrics.lastShownAt = null;
}
function healthCheck() {
  const checks = { ready: true, noOverflow: _notifications.length < 50 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, active: _notifications.length, metrics: getMetrics() };
}
var notifications_default = { show, hide, getActive, clearAll };
export {
  MODULE_ID,
  VERSION,
  clearAll,
  notifications_default as default,
  getActive,
  getMetrics,
  healthCheck,
  hide,
  info,
  resetMetrics,
  setDebug,
  show
};
