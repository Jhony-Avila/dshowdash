import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "ticker.offline.cache-manager";
const hasWindow = typeof window !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
}
const CACHE_NAME = "ticker-offline-v1";
const STORAGE_KEY = "ticker_offline_data";
const MAX_ITEMS = 100;
const MAX_AGE_MS = 24 * 60 * 60 * 1e3;
class OfflineCacheManager {
  constructor(options = {}) {
    this.maxItems = options.maxItems || MAX_ITEMS;
    this.maxAgeMs = options.maxAgeMs || MAX_AGE_MS;
    this.storageKey = options.storageKey || STORAGE_KEY;
    this._isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    this._subscribers = /* @__PURE__ */ new Set();
    this._metrics = { saves: 0, loads: 0, hits: 0, misses: 0, cleanups: 0 };
    this._boundOnlineHandler = this._onOnline.bind(this);
    this._boundOfflineHandler = this._onOffline.bind(this);
  }
  init() {
    if (hasWindow) {
      window.addEventListener("online", this._boundOnlineHandler);
      window.addEventListener("offline", this._boundOfflineHandler);
    }
    _log("debug", "OfflineCacheManager initialized", { isOnline: this._isOnline });
    return this;
  }
  async save(items) {
    if (!Array.isArray(items) || items.length === 0) return false;
    try {
      const trimmed = items.slice(0, this.maxItems);
      const data = { items: trimmed, timestamp: Date.now(), version: VERSION };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this._metrics.saves++;
      _log("debug", `Saved ${trimmed.length} items to offline cache`);
      return true;
    } catch (e) {
      _log("warn", "Failed to save to offline cache", { error: e.message });
      return false;
    }
  }
  async load() {
    this._metrics.loads++;
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        this._metrics.misses++;
        return null;
      }
      const data = JSON.parse(stored);
      if (Date.now() - data.timestamp > this.maxAgeMs) {
        _log("debug", "Cached data expired");
        this._metrics.misses++;
        return null;
      }
      this._metrics.hits++;
      _log("debug", `Loaded ${data.items.length} items from offline cache`);
      return data.items;
    } catch (e) {
      _log("warn", "Failed to load from offline cache", { error: e.message });
      this._metrics.misses++;
      return null;
    }
  }
  async getWithFallback(fetchFn) {
    if (this._isOnline) {
      try {
        const freshData = await fetchFn();
        await this.save(freshData);
        return { data: freshData, source: "network", cached: false };
      } catch (e) {
        _log("warn", "Network fetch failed, trying cache", { error: e.message });
      }
    }
    const cachedData = await this.load();
    if (cachedData) {
      return { data: cachedData, source: "cache", cached: true };
    }
    throw new Error("No data available (network and cache failed)");
  }
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      _log("debug", "Offline cache cleared");
      return true;
    } catch (e) {
      return false;
    }
  }
  cleanup() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return 0;
      const data = JSON.parse(stored);
      const now = Date.now();
      const validItems = data.items.filter((item) => {
        const itemAge = now - new Date(item.published_at || item.timestamp || 0).getTime();
        return itemAge < this.maxAgeMs;
      });
      if (validItems.length !== data.items.length) {
        data.items = validItems.slice(0, this.maxItems);
        data.timestamp = Date.now();
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        this._metrics.cleanups++;
        const removed = data.items.length - validItems.length;
        _log("debug", `Cleanup: removed ${removed} expired items`);
        return removed;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  getCacheInfo() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      const data = JSON.parse(stored);
      return { itemCount: data.items.length, timestamp: data.timestamp, age: Date.now() - data.timestamp, version: data.version, sizeBytes: stored.length };
    } catch (e) {
      return null;
    }
  }
  isOnline() {
    return this._isOnline;
  }
  _onOnline() {
    this._isOnline = true;
    this._notifySubscribers({ online: true });
    _log("debug", "Network: online");
  }
  _onOffline() {
    this._isOnline = false;
    this._notifySubscribers({ online: false });
    _log("debug", "Network: offline");
  }
  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }
  _notifySubscribers(data) {
    this._subscribers.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
      }
    });
  }
  destroy() {
    if (hasWindow) {
      window.removeEventListener("online", this._boundOnlineHandler);
      window.removeEventListener("offline", this._boundOfflineHandler);
    }
    this._subscribers.clear();
  }
  healthCheck() {
    const cacheInfo = this.getCacheInfo();
    const checks = { isOnline: this._isOnline, hasCache: !!cacheInfo, cacheValid: cacheInfo ? Date.now() - cacheInfo.timestamp < this.maxAgeMs : false, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 3 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/4`, isOnline: this._isOnline, cacheInfo, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, isOnline: this._isOnline, cacheInfo: this.getCacheInfo(), maxItems: this.maxItems, maxAgeMs: this.maxAgeMs, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
}
function getVersion() {
  return VERSION;
}
var cache_manager_default = OfflineCacheManager;
export {
  MODULE_ID,
  OfflineCacheManager,
  VERSION,
  cache_manager_default as default,
  getPorts,
  getVersion,
  injectPorts
};
