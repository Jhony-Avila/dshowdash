const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-status/state/store";
let _listeners = [];
let _store = {
  statuses: {},
  loading: false,
  error: null,
  mounted: false,
  lastUpdate: null,
  refreshInterval: 3e4,
  _initialized: false
};
function getState() {
  return Object.assign({}, _store);
}
function get(key) {
  return key ? _store[key] : getState();
}
function set(key, value) {
  if (typeof key === "object") {
    Object.assign(_store, key);
  } else {
    _store[key] = value;
  }
  _store.lastUpdate = Date.now();
  _notify();
}
function setStatus(statusId, data) {
  _store.statuses[statusId] = Object.assign({}, _store.statuses[statusId], data, { updatedAt: Date.now() });
  _notify();
}
function setStatuses(statuses) {
  _store.statuses = statuses || {};
  _store.lastUpdate = Date.now();
  _notify();
}
function getStatus(statusId) {
  return _store.statuses[statusId] || null;
}
function getAllStatuses() {
  return Object.assign({}, _store.statuses);
}
function setLoading(statusId, loading) {
  if (statusId) {
    if (!_store.statuses[statusId]) _store.statuses[statusId] = {};
    _store.statuses[statusId].loading = loading;
  } else {
    _store.loading = loading;
  }
  _notify();
}
function setError(statusId, error) {
  if (statusId) {
    if (!_store.statuses[statusId]) _store.statuses[statusId] = {};
    _store.statuses[statusId].error = error;
    _store.statuses[statusId].level = "error";
  } else {
    _store.error = error;
  }
  _notify();
}
function reset() {
  _store = { statuses: {}, loading: false, error: null, mounted: false, lastUpdate: null, refreshInterval: 3e4, _initialized: false };
  _notify();
}
function subscribe(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}
function _notify() {
  _listeners.forEach((fn) => {
    try {
      fn(getState());
    } catch (e) {
    }
  });
}
function getOverallHealth() {
  const statuses = Object.values(_store.statuses);
  if (statuses.length === 0) return "unknown";
  const errors = statuses.filter((s) => s.level === "error").length;
  const warnings = statuses.filter((s) => s.level === "warning").length;
  if (errors > 0) return "error";
  if (warnings > 0) return "warning";
  return "ok";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, overallHealth: getOverallHealth() };
}
var store_default = { getState, get, set, setStatus, setStatuses, getStatus, getAllStatuses, setLoading, setError, reset, subscribe, getOverallHealth };
export {
  MODULE_ID,
  VERSION,
  store_default as default,
  get,
  getAllStatuses,
  getOverallHealth,
  getState,
  getStatus,
  healthCheck,
  info,
  reset,
  set,
  setError,
  setLoading,
  setStatus,
  setStatuses,
  subscribe
};
