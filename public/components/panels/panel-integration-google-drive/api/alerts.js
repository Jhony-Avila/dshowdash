const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-integration-google-drive/api/alerts";
const _alerts = [];
let _maxAlerts = 100;
function add(alert) {
  const entry = { id: Date.now(), timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...alert };
  _alerts.unshift(entry);
  if (_alerts.length > _maxAlerts) _alerts.pop();
  return entry;
}
function remove(id) {
  const index = _alerts.findIndex((a) => a.id === id);
  if (index > -1) return _alerts.splice(index, 1)[0];
  return null;
}
function getAll() {
  return [..._alerts];
}
function getByType(type) {
  return _alerts.filter((a) => a.type === type);
}
function clear() {
  _alerts.length = 0;
}
function setMaxAlerts(max) {
  _maxAlerts = max;
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID, alertCount: _alerts.length };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, alertCount: _alerts.length, maxAlerts: _maxAlerts, healthCheck: healthCheck() };
}
var alerts_default = { add, remove, getAll, getByType, clear, setMaxAlerts, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  add,
  clear,
  alerts_default as default,
  getAll,
  getByType,
  healthCheck,
  info,
  remove,
  setMaxAlerts
};
