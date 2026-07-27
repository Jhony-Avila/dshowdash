const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-observability/state/store";
let _listeners = [];
let _store = {
  actions: { total: 0, accepted: 0, rejected: 0, errors: 0, perMinute: 0 },
  replays: { total: 0, lastAt: null },
  snapshots: { total: 0, lastAt: null },
  health: { status: "unknown", modules: {}, score: 0 },
  recentErrors: [],
  metrics: { cpu: 0, memory: 0, requests: 0, latency: 0 },
  mounted: false,
  loading: false,
  error: null,
  lastUpdate: null,
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
function updateActions(actions) {
  _store.actions = Object.assign({}, _store.actions, actions);
  _notify();
}
function updateHealth(health) {
  _store.health = Object.assign({}, _store.health, health);
  _notify();
}
function updateMetrics(metrics) {
  _store.metrics = Object.assign({}, _store.metrics, metrics);
  _notify();
}
function addError(error) {
  _store.recentErrors.unshift({ error, timestamp: Date.now() });
  if (_store.recentErrors.length > 50) _store.recentErrors.pop();
  _notify();
}
function clearErrors() {
  _store.recentErrors = [];
  _notify();
}
function reset() {
  _store = { actions: { total: 0, accepted: 0, rejected: 0, errors: 0, perMinute: 0 }, replays: { total: 0, lastAt: null }, snapshots: { total: 0, lastAt: null }, health: { status: "unknown", modules: {}, score: 0 }, recentErrors: [], metrics: { cpu: 0, memory: 0, requests: 0, latency: 0 }, mounted: false, loading: false, error: null, lastUpdate: null, _initialized: false };
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
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, storeHealth: _store.health.status };
}
var store_default = { getState, get, set, updateActions, updateHealth, updateMetrics, addError, clearErrors, reset, subscribe };
export {
  MODULE_ID,
  VERSION,
  addError,
  clearErrors,
  store_default as default,
  get,
  getState,
  healthCheck,
  info,
  reset,
  set,
  subscribe,
  updateActions,
  updateHealth,
  updateMetrics
};
