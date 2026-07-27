import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "navrail-registry-state";
const VERSION = "4.4.0-ES6";
const _Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return _Ports.get(name);
}
function injectPorts(p) {
  return _Ports.inject(p);
}
function getPortsSnapshot() {
  return _Ports.snapshot();
}
const _log = function(level, ...args) {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getPort("logger");
  if (logger && typeof logger[level] === "function") {
    logger[level].apply(logger, [prefix].concat(args));
  } else if (level === "error" || level === "warn") {
    const fn = console.debug;
    fn.apply(console, [prefix].concat(args));
  }
};
let _groups = [];
let _items = [];
let _mobileItems = [];
let _config = {};
let _userLevel = 0;
let _loaded = false;
let _loading = false;
let _lastLoad = 0;
let _loadedAt = null;
const _subscribers = /* @__PURE__ */ new Set();
let _errors = [];
let _metrics = { source: null, apiCalls: 0, apiFails: 0, cacheHits: 0, indexedDBHits: 0, lastLoadTime: null, loadDuration: 0, offlineMode: false };
const CACHE_TTL = 5 * 60 * 1e3;
const OFFLINE_CACHE_TTL = 24 * 60 * 60 * 1e3;
function setGroups(groups) {
  _groups = groups;
}
function setItems(items) {
  _items = items;
}
function setMobileItems(items) {
  _mobileItems = items;
}
function setConfig(config) {
  _config = config;
}
function setUserLevel(level) {
  _userLevel = level;
}
function setLoaded(loaded) {
  _loaded = loaded;
}
function setLoading(loading) {
  _loading = loading;
}
function setLastLoad(time) {
  _lastLoad = time;
}
function setLoadedAt(time) {
  _loadedAt = time;
}
function updateMetrics(updates) {
  Object.assign(_metrics, updates);
}
function addError(error) {
  _errors.push(error);
  if (_errors.length > 10) _errors.shift();
}
function clearErrors() {
  _errors = [];
}
function getGroups() {
  return _groups.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
}
function getItems() {
  return _items.slice();
}
function getItemsByGroup(groupId) {
  return _items.filter((item) => item.group === groupId && !item.hidden).sort((a, b) => (a.order || 0) - (b.order || 0));
}
function getItem(itemId) {
  return _items.find((item) => item.id === itemId) || null;
}
function getMobileItems() {
  return _mobileItems.map((id) => _items.find((item) => item.id === id)).filter(Boolean);
}
function getMobileItemIds() {
  return _mobileItems.slice();
}
function getConfig(key) {
  if (key) return _config[key];
  return Object.assign({}, _config);
}
function getUserLevel() {
  return _userLevel;
}
function isLoaded() {
  return _loaded;
}
function isLoading() {
  return _loading;
}
function getLastLoad() {
  return _lastLoad;
}
function getLoadedAt() {
  return _loadedAt;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function getErrors() {
  return _errors.slice(-10);
}
function getRawGroups() {
  return _groups;
}
function getRawItems() {
  return _items;
}
function getRawMobileItems() {
  return _mobileItems;
}
function getRawConfig() {
  return _config;
}
function subscribe(callback) {
  if (typeof callback === "function") {
    _subscribers.add(callback);
  }
  return () => {
    _subscribers.delete(callback);
  };
}
function unsubscribe(callback) {
  _subscribers.delete(callback);
}
function notify() {
  _subscribers.forEach((fn) => {
    try {
      fn({ groups: _groups, items: _items, mobileItems: _mobileItems });
    } catch (e) {
      _log("error", "Subscriber error", e);
    }
  });
}
function registerItem(item) {
  if (!item || !item.id) return false;
  const exists = _items.findIndex((i) => i.id === item.id);
  if (exists >= 0) {
    _items[exists] = Object.assign({}, _items[exists], item);
  } else {
    _items.push(item);
  }
  notify();
  return true;
}
function registerGroup(group) {
  if (!group || !group.id) return false;
  const exists = _groups.findIndex((g) => g.id === group.id);
  if (exists >= 0) {
    _groups[exists] = Object.assign({}, _groups[exists], group);
  } else {
    _groups.push(group);
  }
  notify();
  return true;
}
function clear() {
  _groups = [];
  _items = [];
  _mobileItems = [];
  _config = {};
  _loaded = false;
  _lastLoad = 0;
  _loadedAt = null;
}
function reset() {
  clear();
  _metrics = { source: null, apiCalls: 0, apiFails: 0, cacheHits: 0, indexedDBHits: 0, lastLoadTime: null, loadDuration: 0, offlineMode: false };
  _errors = [];
}
function getSnapshot() {
  return { groups: _groups, items: _items, mobileItems: _mobileItems, config: _config, userLevel: _userLevel };
}
function restoreSnapshot(snapshot) {
  if (!snapshot) return;
  _groups = snapshot.groups || [];
  _items = snapshot.items || [];
  _mobileItems = snapshot.mobileItems || [];
  _config = snapshot.config || {};
  _userLevel = snapshot.userLevel || 0;
  _loaded = true;
  _lastLoad = Date.now();
  _loadedAt = Date.now();
}
function healthCheck() {
  const checks = { loaded: _loaded, hasItems: _items.length > 0, noErrors: _errors.length === 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: _Ports.isInitialized() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, loaded: _loaded, portsInitialized: _Ports.isInitialized(), itemsCount: _items.length, groupsCount: _groups.length, metrics: getMetrics() };
}
var store_default = { CACHE_TTL, OFFLINE_CACHE_TTL, setGroups, setItems, setMobileItems, setConfig, setUserLevel, setLoaded, setLoading, setLastLoad, setLoadedAt, updateMetrics, addError, clearErrors, getGroups, getItems, getItemsByGroup, getItem, getMobileItems, getMobileItemIds, getConfig, getUserLevel, isLoaded, isLoading, getLastLoad, getLoadedAt, getMetrics, getErrors, getRawGroups, getRawItems, getRawMobileItems, getRawConfig, subscribe, unsubscribe, notify, registerItem, registerGroup, clear, reset, getSnapshot, restoreSnapshot, healthCheck, info, injectPorts, getPorts: getPortsSnapshot };
export {
  CACHE_TTL,
  MODULE_ID,
  OFFLINE_CACHE_TTL,
  VERSION,
  addError,
  clear,
  clearErrors,
  store_default as default,
  getConfig,
  getErrors,
  getGroups,
  getItem,
  getItems,
  getItemsByGroup,
  getLastLoad,
  getLoadedAt,
  getMetrics,
  getMobileItemIds,
  getMobileItems,
  getPortsSnapshot,
  getRawConfig,
  getRawGroups,
  getRawItems,
  getRawMobileItems,
  getSnapshot,
  getUserLevel,
  healthCheck,
  info,
  injectPorts,
  isLoaded,
  isLoading,
  notify,
  registerGroup,
  registerItem,
  reset,
  restoreSnapshot,
  setConfig,
  setGroups,
  setItems,
  setLastLoad,
  setLoaded,
  setLoadedAt,
  setLoading,
  setMobileItems,
  setUserLevel,
  subscribe,
  unsubscribe,
  updateMetrics
};
