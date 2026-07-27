import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { IndexedDBCache, setLogger as setCacheLogger } from "./cache/indexeddb.js";
import * as Store from "./state/store.js";
import * as Processor from "./data/processor.js";
import * as ApiService from "./api/service.js";
import * as Telemetry from "./telemetry/index.js";
const MODULE_ID = "navrail-registry";
const VERSION = "4.3.1-IMPORT-FIX";
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
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
const _emitEvent = (eventName, detail) => {
  if (!detail) detail = {};
  const eb = _getPort("eventBus");
  if (eb && typeof eb.emit === "function") eb.emit(eventName, Object.assign({}, detail, { timestamp: Date.now() }));
  document.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
};
function _getResolvedUserLevel() {
  if (typeof window !== "undefined" && window.PermissionResolver && typeof window.PermissionResolver.getLevel === "function") {
    return window.PermissionResolver.getLevel();
  }
  return Store.getUserLevel();
}
const NavRailRegistry = {
  VERSION,
  MODULE_ID,
  load(options) {
    const self = this;
    if (!options) options = {};
    const force = options.force || false;
    const now = Date.now();
    const metrics = Store.getMetrics();
    if (!force && Store.isLoaded() && now - Store.getLastLoad() < Store.CACHE_TTL) {
      Store.updateMetrics({ cacheHits: metrics.cacheHits + 1 });
      _log("debug", "Using memory cache");
      return Promise.resolve({ success: true, source: "cache" });
    }
    if (Store.isLoading()) {
      _log("debug", "Load already in progress");
      return Promise.resolve({ success: true, source: "pending" });
    }
    Store.setLoading(true);
    _initPorts();
    setCacheLogger(_getPort("logger"));
    const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    return this._loadFromAPI(startTime).catch((error) => {
      _log("warn", "API failed, trying IndexedDB", { error: error.message });
      const m = Store.getMetrics();
      Store.updateMetrics({ apiFails: m.apiFails + 1 });
      Store.addError({ type: "API_FAIL", message: error.message, timestamp: Date.now() });
      return self._loadFromIndexedDB(startTime);
    }).catch((error) => {
      _log("warn", "IndexedDB failed, using fallback", { error: error.message });
      self._loadFallback();
      Store.setLoading(false);
      return { success: true, source: "fallback", error: error.message };
    }).then((result) => {
      Store.setLoading(false);
      Telemetry.setPortsInfo(Ports.snapshot(), Ports.isInitialized());
      return result;
    });
  },
  _loadFromAPI(startTime) {
    const self = this;
    return ApiService.fetchManifest().then((response) => {
      if (response.status === 401 || response.status === 403) {
        _log("info", "API auth required (expected on login), using fallback");
        self._loadFallback();
        Store.setLoading(false);
        return { success: true, source: "auth-required", authRequired: true };
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }).then((result) => {
      if (result && result.authRequired) return result;
      if (!result.ok) throw new Error(result.error || "API error");
      const processed = Processor.processAPIData(result.data);
      Store.setGroups(processed.groups);
      Store.setItems(processed.items);
      Store.setMobileItems(processed.mobileItems);
      Store.setConfig(processed.config || {});
      Store.setUserLevel(processed.userLevel || 0);
      Store.setLoaded(true);
      Store.setLastLoad(Date.now());
      Store.setLoadedAt(Date.now());
      const loadDuration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
      const m = Store.getMetrics();
      Store.updateMetrics({
        source: "api",
        apiCalls: m.apiCalls + 1,
        lastLoadTime: (/* @__PURE__ */ new Date()).toISOString(),
        loadDuration,
        offlineMode: false
      });
      const groups = Store.getRawGroups();
      const items = Store.getRawItems();
      _log("info", "Loaded from API", { groups: groups.length, items: items.length, duration: `${loadDuration.toFixed(0)}ms` });
      _emitEvent("navrail:registry:loaded", { source: "api", groups: groups.length, items: items.length });
      Store.notify();
      IndexedDBCache.save(Store.getSnapshot(), VERSION);
      Store.setLoading(false);
      return { success: true, source: "api" };
    });
  },
  _loadFromIndexedDB(startTime) {
    const self = this;
    return IndexedDBCache.load().then((cached) => {
      if (!cached || !cached.data) {
        _log("info", "No IndexedDB cache available, using fallback");
        self._loadFallback();
        Store.setLoading(false);
        return { success: true, source: "fallback", offline: true, cache: "missing" };
      }
      const cacheAge = Date.now() - cached.timestamp;
      if (cacheAge > Store.OFFLINE_CACHE_TTL) {
        _log("warn", "IndexedDB cache too old", { age: cacheAge });
      }
      Store.restoreSnapshot(cached.data);
      const loadDuration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
      const m = Store.getMetrics();
      Store.updateMetrics({
        source: "indexedDB",
        indexedDBHits: m.indexedDBHits + 1,
        lastLoadTime: (/* @__PURE__ */ new Date()).toISOString(),
        loadDuration,
        offlineMode: true
      });
      const groups = Store.getRawGroups();
      const items = Store.getRawItems();
      _log("info", "Loaded from IndexedDB (offline)", { groups: groups.length, items: items.length, cacheAge });
      _emitEvent("navrail:registry:loaded", { source: "indexedDB", groups: groups.length, items: items.length, offline: true });
      Store.notify();
      Store.setLoading(false);
      return { success: true, source: "indexedDB", offline: true, cacheAge };
    });
  },
  _loadFallback() {
    const fallback = Processor.generateFallback();
    Store.setGroups(fallback.groups);
    Store.setItems(fallback.items);
    Store.setMobileItems(fallback.mobileItems);
    Store.setConfig(fallback.config);
    Store.setUserLevel(fallback.userLevel);
    Store.setLoaded(true);
    Store.setLastLoad(Date.now());
    Store.setLoadedAt(Date.now());
    Store.updateMetrics({ source: "fallback" });
    const groups = Store.getRawGroups();
    const items = Store.getRawItems();
    _log("info", "Fallback loaded", { groups: groups.length, items: items.length });
    _emitEvent("navrail:registry:loaded", { source: "fallback" });
    Store.notify();
  },
  invalidateCache() {
    Store.setLastLoad(0);
    _log("debug", "Memory cache invalidated");
  },
  clearOfflineCache() {
    return IndexedDBCache.clear().then((success) => {
      _log("info", "IndexedDB cache cleared", { success });
      return success;
    });
  },
  getGroups() {
    if (!Store.isLoaded()) this._loadFallback();
    return Store.getGroups();
  },
  getItems() {
    if (!Store.isLoaded()) this._loadFallback();
    return Store.getItems();
  },
  getItemsByGroup(groupId) {
    if (!Store.isLoaded()) this._loadFallback();
    return Store.getItemsByGroup(groupId);
  },
  getItem(itemId) {
    if (!Store.isLoaded()) this._loadFallback();
    return Store.getItem(itemId);
  },
  getMobileItems() {
    if (!Store.isLoaded()) this._loadFallback();
    return Store.getMobileItems();
  },
  getMobileItemIds() {
    if (!Store.isLoaded()) this._loadFallback();
    return Store.getMobileItemIds();
  },
  getConfig(key) {
    return Store.getConfig(key);
  },
  getUserLevel() {
    return _getResolvedUserLevel();
  },
  registerItem(item) {
    return Store.registerItem(item);
  },
  registerGroup(group) {
    return Store.registerGroup(group);
  },
  subscribe(callback) {
    return Store.subscribe(callback);
  },
  unsubscribe(callback) {
    return Store.unsubscribe(callback);
  },
  createItem(data) {
    const self = this;
    return ApiService.createItem(data).then((result) => {
      if (result.ok) self.invalidateCache();
      return result;
    });
  },
  updateItem(id, data) {
    const self = this;
    return ApiService.updateItem(id, data).then((result) => {
      if (result.ok) self.invalidateCache();
      return result;
    });
  },
  deleteItem(id) {
    const self = this;
    return ApiService.deleteItem(id).then((result) => {
      if (result.ok) self.invalidateCache();
      return result;
    });
  },
  toggleItem(id) {
    const self = this;
    return ApiService.toggleItem(id).then((result) => {
      if (result.ok) self.invalidateCache();
      return result;
    });
  },
  reorderItems(itemIds) {
    const self = this;
    return ApiService.reorderItems(itemIds).then((result) => {
      if (result.ok) self.invalidateCache();
      return result;
    });
  },
  isLoaded() {
    return Store.isLoaded();
  },
  getSource() {
    return Store.getMetrics().source;
  },
  isOfflineMode() {
    return Store.getMetrics().offlineMode;
  },
  getMetrics() {
    return Store.getMetrics();
  },
  getManifest() {
    return Telemetry.getManifest();
  },
  healthCheck() {
    return Telemetry.healthCheck();
  },
  info() {
    return Telemetry.info();
  },
  clear() {
    Store.clear();
  },
  reset() {
    Store.reset();
    IndexedDBCache.clear();
  },
  _indexedDBCache: IndexedDBCache
};
if (typeof window !== "undefined") {
  window.NavRailRegistry = NavRailRegistry;
}
var registry_default = NavRailRegistry;
export {
  MODULE_ID,
  NavRailRegistry,
  VERSION,
  registry_default as default,
  getPorts,
  injectPorts
};
