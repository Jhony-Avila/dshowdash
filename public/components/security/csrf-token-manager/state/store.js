const VERSION = "2.1.0-ENTERPRISE-FIX";
const MODULE_ID = "csrf-token-manager-store";
let _state = { token: null, expiresAt: null, refreshing: false, lastRefresh: null, initialized: false };
let _config = {};
let _deps = {};
let _subscribers = [];
let _handlers = {};
let _stats = { refreshCount: 0, errorCount: 0, lastError: null };
function init(config = {}, deps = {}) {
  _config = { ...config };
  _deps = { ...deps };
  _state.initialized = true;
}
function isInitialized() {
  return _state.initialized;
}
function getState() {
  return { ..._state };
}
function getToken() {
  return _state.token;
}
function getConfig() {
  return { ..._config };
}
function getDeps() {
  return { ..._deps };
}
function getStats() {
  return { ..._stats, state: getState() };
}
function setToken(token, expiresAt = null) {
  _state.token = token;
  _state.expiresAt = expiresAt;
  _state.lastRefresh = Date.now();
  _stats.refreshCount++;
  _notify();
}
function setRefreshing(val) {
  _state.refreshing = val;
  _notify();
}
function clearToken() {
  _state.token = null;
  _state.expiresAt = null;
  _notify();
}
function isValid() {
  return _state.token && (!_state.expiresAt || _state.expiresAt > Date.now());
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
function addHandler(eventName, handler) {
  if (!_handlers[eventName]) _handlers[eventName] = [];
  if (typeof handler === "function") _handlers[eventName].push(handler);
}
function removeHandler(eventName, handler) {
  if (_handlers[eventName]) {
    _handlers[eventName] = _handlers[eventName].filter((h) => h !== handler);
  }
}
function getHandlers(eventName) {
  return _handlers[eventName] || [];
}
function reset() {
  _state = { token: null, expiresAt: null, refreshing: false, lastRefresh: null, initialized: false };
  _config = {};
  _deps = {};
  _subscribers = [];
  _handlers = {};
  _stats = { refreshCount: 0, errorCount: 0, lastError: null };
}
function healthCheck() {
  const checks = { hasState: true, initialized: _state.initialized, hasToken: !!_state.token, tokenValid: isValid() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, refreshing: _state.refreshing, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, hasToken: !!_state.token, isValid: isValid(), refreshing: _state.refreshing, timestamp: Date.now() };
}
const csrfStore = {
  init,
  isInitialized,
  getState,
  getToken,
  getConfig,
  getDeps,
  getStats,
  setToken,
  setRefreshing,
  clearToken,
  isValid,
  subscribe,
  addHandler,
  removeHandler,
  getHandlers,
  reset,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
var store_default = csrfStore;
export {
  MODULE_ID,
  VERSION,
  addHandler,
  clearToken,
  csrfStore,
  store_default as default,
  getConfig,
  getDeps,
  getHandlers,
  getState,
  getStats,
  getToken,
  healthCheck,
  info,
  init,
  isInitialized,
  isValid,
  removeHandler,
  reset,
  setRefreshing,
  setToken,
  subscribe
};
