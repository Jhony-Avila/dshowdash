import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-maps/api/alerts";
let _debug = false;
const _alerts = [];
const _metrics = { created: 0, dismissed: 0, lastAlertAt: null };
function createAlert(type, message, options = {}) {
  const alert = { id: `alert-${Date.now()}`, type, message, timestamp: Date.now(), ...options };
  _alerts.push(alert);
  _metrics.created++;
  _metrics.lastAlertAt = Date.now();
  return alert;
}
function dismissAlert(id) {
  const idx = _alerts.findIndex((a) => a.id === id);
  if (idx !== -1) {
    _alerts.splice(idx, 1);
    _metrics.dismissed++;
    return true;
  }
  return false;
}
function getAlerts() {
  return [..._alerts];
}
function clearAlerts() {
  _alerts.length = 0;
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getMetrics() {
  return { ..._metrics, active: _alerts.length };
}
function resetMetrics() {
  _metrics.created = 0;
  _metrics.dismissed = 0;
  _metrics.lastAlertAt = null;
}
function healthCheck() {
  const checks = { ready: true, noOverflow: _alerts.length < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, alerts: _alerts.length, metrics: getMetrics() };
}
var alerts_default = { createAlert, dismissAlert, getAlerts, clearAlerts };
export {
  MODULE_ID,
  VERSION,
  clearAlerts,
  createAlert,
  alerts_default as default,
  dismissAlert,
  getAlerts,
  getMetrics,
  healthCheck,
  info,
  resetMetrics,
  setDebug
};
