import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { deepClone, generateSessionId } from "../utils/helpers.js";
const VERSION = "6.0.0-P18EC";
const MODULE_ID = "session-manager.state.store";
const hasWindow = typeof window !== "undefined";
const SESSION_SHAPE = Object.freeze({ authenticated: false, user: null, userId: null, roles: [], token: null, csrf: null, sessionId: null, expiresAt: null, lastActivity: null, loginAt: null, timeout: 18e5 });
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
function _log(level, msg, ctx = {}) {
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  logger[level](msg, { component: MODULE_ID, ...ctx });
}
const MUTATION_SOURCES = Object.freeze({ USER: "user", SYSTEM: "system", API: "api", SYNC: "sync", INTERNAL: "internal" });
let _state = Object.freeze({ ...SESSION_SHAPE });
let _stateVersion = 0;
let _pendingTransaction = null;
const _history = [];
const MAX_HISTORY = 10;
const _listeners = /* @__PURE__ */ new Set();
const _metrics = { updates: 0, sets: 0, clears: 0, resets: 0, commits: 0, rollbacks: 0, notifications: 0, listenerErrors: 0, lastUpdateAt: null, lastSource: null };
function _createSnapshot() {
  return { state: deepClone(_state), version: _stateVersion, timestamp: Date.now() };
}
function _saveToHistory(snapshot, action, source) {
  _history.push({ ...snapshot, action, source });
  if (_history.length > MAX_HISTORY) _history.shift();
}
function _notify(action, source, key = null, newValue = null, oldValue = null) {
  const payload = { action, source, key, newValue, oldValue, state: getState(), version: _stateVersion, timestamp: Date.now() };
  _listeners.forEach((fn) => {
    try {
      fn(payload);
      _metrics.notifications++;
    } catch (e) {
      _metrics.listenerErrors++;
      _log("error", "Listener error", { error: e.message });
    }
  });
  _metrics.updates++;
  _metrics.lastUpdateAt = Date.now();
  _metrics.lastSource = source;
}
function _applyChange(changes, source = MUTATION_SOURCES.INTERNAL) {
  const snapshot = _createSnapshot();
  _saveToHistory(snapshot, "change", source);
  _state = Object.freeze({ ..._state, ...changes });
  _stateVersion++;
  return snapshot;
}
function beginTransaction(source = MUTATION_SOURCES.INTERNAL) {
  if (_pendingTransaction) {
    _log("warn", "Transaction already in progress, committing previous");
    commit();
  }
  _pendingTransaction = { snapshot: _createSnapshot(), source, changes: {}, startedAt: Date.now() };
  return true;
}
function addToTransaction(changes) {
  if (!_pendingTransaction) {
    _log("warn", "No transaction in progress, starting one");
    beginTransaction(MUTATION_SOURCES.INTERNAL);
  }
  Object.assign(_pendingTransaction.changes, changes);
  return true;
}
function commit() {
  if (!_pendingTransaction) {
    _log("warn", "No transaction to commit");
    return false;
  }
  const { changes, source } = _pendingTransaction;
  _applyChange(changes, source);
  _metrics.commits++;
  const snap = _pendingTransaction.snapshot;
  _notify("commit", source, null, changes, snap.state);
  _pendingTransaction = null;
  return true;
}
function rollback() {
  if (!_pendingTransaction) {
    _log("warn", "No transaction to rollback");
    return false;
  }
  _metrics.rollbacks++;
  _log("info", "Transaction rolled back", { source: _pendingTransaction.source });
  _pendingTransaction = null;
  return true;
}
function rollbackToVersion(targetVersion) {
  const historyEntry = _history.find((h) => h.version === targetVersion);
  if (!historyEntry) {
    _log("warn", "Version not found in history", { targetVersion });
    return false;
  }
  _metrics.rollbacks++;
  _state = Object.freeze({ ...historyEntry.state });
  _stateVersion++;
  _notify("rollback-to-version", MUTATION_SOURCES.SYSTEM, null, _state, null);
  _log("info", "Rolled back to version", { targetVersion, newVersion: _stateVersion });
  return true;
}
function getState() {
  return deepClone(_state);
}
function get(key) {
  if (key) return _state[key];
  return getState();
}
function set(key, value, source = MUTATION_SOURCES.INTERNAL) {
  _metrics.sets++;
  const oldValue = _state[key];
  _applyChange({ [key]: value }, source);
  _notify("set", source, key, value, oldValue);
  return true;
}
function update(patch, source = MUTATION_SOURCES.INTERNAL) {
  const oldState = getState();
  _applyChange(patch, source);
  _notify("update", source, null, patch, oldState);
  return true;
}
function clear(source = MUTATION_SOURCES.INTERNAL) {
  _metrics.clears++;
  const oldState = getState();
  _applyChange({ ...SESSION_SHAPE }, source);
  _state = Object.freeze({ ...SESSION_SHAPE });
  _notify("clear", source, null, null, oldState);
  return true;
}
function reset(source = MUTATION_SOURCES.SYSTEM) {
  _metrics.resets++;
  const oldState = getState();
  _state = Object.freeze({ ...SESSION_SHAPE });
  _stateVersion++;
  _history.length = 0;
  _pendingTransaction = null;
  _notify("reset", source, null, null, oldState);
  return true;
}
function isAuthenticated() {
  return !!_state.authenticated;
}
function getUser() {
  return _state.user ? deepClone(_state.user) : null;
}
function getUserId() {
  return _state.userId || _state.user?.id || null;
}
function getRoles() {
  return [..._state.roles || _state.user?.roles || []];
}
function getToken() {
  return _state.token;
}
function getCsrf() {
  return _state.csrf;
}
function getSessionId() {
  return _state.sessionId;
}
function getExpiresAt() {
  return _state.expiresAt;
}
function getLastActivity() {
  return _state.lastActivity;
}
function getLoginAt() {
  return _state.loginAt;
}
function getTimeout() {
  return _state.timeout || 18e5;
}
function getDuration() {
  if (!_state.loginAt) return 0;
  return Date.now() - _state.loginAt;
}
function getVersion() {
  return VERSION;
}
function getStateVersion() {
  return _stateVersion;
}
function setUser(user, source = MUTATION_SOURCES.API) {
  const oldUser = _state.user;
  const u = user;
  _applyChange({ user, userId: u?.id || null, roles: u?.roles || [], authenticated: user !== null, lastActivity: Date.now() }, source);
  _notify("user-set", source, "user", user, oldUser);
  return true;
}
function clearUser(source = MUTATION_SOURCES.API) {
  const oldUser = _state.user;
  _applyChange({ user: null, userId: null, roles: [], authenticated: false }, source);
  _notify("user-cleared", source, "user", null, oldUser);
  return true;
}
function setToken(token, source = MUTATION_SOURCES.API) {
  const oldToken = _state.token;
  _applyChange({ token }, source);
  _notify("token-set", source, "token", token ? "[SET]" : null, oldToken ? "[WAS_SET]" : null);
  return true;
}
function clearToken(source = MUTATION_SOURCES.API) {
  const oldToken = _state.token;
  _applyChange({ token: null }, source);
  _notify("token-cleared", source, "token", null, oldToken ? "[WAS_SET]" : null);
  return true;
}
function setCsrf(csrf, source = MUTATION_SOURCES.API) {
  const oldCsrf = _state.csrf;
  _applyChange({ csrf }, source);
  _notify("csrf-set", source, "csrf", csrf ? "[SET]" : null, oldCsrf ? "[WAS_SET]" : null);
  return true;
}
function clearCsrf(source = MUTATION_SOURCES.API) {
  _applyChange({ csrf: null }, source);
  _notify("csrf-cleared", source, "csrf", null, null);
  return true;
}
function setSessionId(id, source = MUTATION_SOURCES.SYSTEM) {
  const sessionId = id || generateSessionId();
  _applyChange({ sessionId }, source);
  _notify("session-started", source, "sessionId", sessionId, null);
  return sessionId;
}
function updateActivity(source = MUTATION_SOURCES.USER) {
  _applyChange({ lastActivity: Date.now() }, source);
  _notify("activity", source, "lastActivity", _state.lastActivity, null);
  return true;
}
function setTimeoutValue(timeoutMs, source = MUTATION_SOURCES.SYSTEM) {
  _applyChange({ timeout: timeoutMs }, source);
  return true;
}
function subscribe(callback) {
  if (typeof callback === "function") {
    _listeners.add(callback);
    return () => _listeners.delete(callback);
  }
  return () => {
  };
}
function clearListeners() {
  _listeners.clear();
}
function toJSON() {
  return { ...getState(), token: _state.token ? "[REDACTED]" : null, csrf: _state.csrf ? "[REDACTED]" : null };
}
function getStats() {
  return { updates: _metrics.updates, lastUpdateAt: _metrics.lastUpdateAt, lastSource: _metrics.lastSource, listenerCount: _listeners.size, stateVersion: _stateVersion, historyLength: _history.length, hasPendingTransaction: !!_pendingTransaction };
}
function getHistory() {
  return _history.map((h) => ({ version: h.version, action: h.action, source: h.source, timestamp: h.timestamp }));
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, stateVersion: _stateVersion, authenticated: _state.authenticated, userId: _state.userId, sessionId: _state.sessionId, hasToken: !!_state.token, hasCsrf: !!_state.csrf, rolesCount: _state.roles?.length || 0, listenerCount: _listeners.size, historyLength: _history.length, hasPendingTransaction: !!_pendingTransaction, portsInitialized: Ports.isInitialized(), metrics: { ..._metrics }, timestamp: Date.now() };
}
function healthCheck() {
  const checks = { stateImmutable: Object.isFrozen(_state), stateInitialized: _state !== null, shapeValid: typeof _state.authenticated === "boolean", versionTracked: _stateVersion >= 0, listenersHealthy: _metrics.listenerErrors === 0 || _metrics.listenerErrors / Math.max(_metrics.notifications, 1) < 0.1, lowErrorRate: _metrics.listenerErrors < 10, historyManaged: _history.length <= MAX_HISTORY, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, healthy: passed === total, checks, stateVersion: _stateVersion, authenticated: _state.authenticated, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
const sessionStore = { getState, get, set, update, clear, reset, beginTransaction, addToTransaction, commit, rollback, rollbackToVersion, MUTATION_SOURCES, isAuthenticated, getUser, getUserId, getRoles, getToken, getCsrf, getSessionId, getExpiresAt, getLastActivity, getLoginAt, getTimeout, getDuration, getVersion, getStateVersion, setUser, clearUser, setToken, clearToken, setCsrf, clearCsrf, setSessionId, updateActivity, setTimeout: setTimeoutValue, subscribe, clearListeners, toJSON, getStats, getHistory, info, healthCheck, injectPorts, getPorts };
var store_default = sessionStore;
export {
  MODULE_ID,
  MUTATION_SOURCES,
  SESSION_SHAPE,
  VERSION,
  store_default as default,
  getPorts,
  injectPorts,
  sessionStore
};
