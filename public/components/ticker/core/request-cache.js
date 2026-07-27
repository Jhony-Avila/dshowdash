import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "ticker.core.request-cache";
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};
class RequestCache {
  constructor(options = {}) {
    this.ttl = options.ttl || 5e3;
    this.maxSize = options.maxSize || 50;
    this._cache = /* @__PURE__ */ new Map();
    this._pending = /* @__PURE__ */ new Map();
    this._metrics = { hits: 0, misses: 0, deduped: 0, evictions: 0 };
  }
  async dedupe(key, fetchFn) {
    const cached = this._getFromCache(key);
    if (cached !== null) {
      this._metrics.hits++;
      _log("debug", `Cache HIT: ${key}`);
      return cached;
    }
    if (this._pending.has(key)) {
      this._metrics.deduped++;
      _log("debug", `Request DEDUPED: ${key}`);
      return this._pending.get(key);
    }
    this._metrics.misses++;
    const promise = this._fetchAndCache(key, fetchFn);
    this._pending.set(key, promise);
    try {
      const result = await promise;
      return result;
    } finally {
      this._pending.delete(key);
    }
  }
  async _fetchAndCache(key, fetchFn) {
    try {
      const result = await fetchFn();
      this._setCache(key, result);
      return result;
    } catch (error) {
      throw error;
    }
  }
  _getFromCache(key) {
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return null;
    }
    return entry.data;
  }
  _setCache(key, data) {
    if (this._cache.size >= this.maxSize) {
      const oldestKey = this._cache.keys().next().value;
      this._cache.delete(oldestKey);
      this._metrics.evictions++;
    }
    this._cache.set(key, { data, expiresAt: Date.now() + this.ttl, createdAt: Date.now() });
  }
  invalidate(key) {
    if (key) {
      this._cache.delete(key);
    } else {
      this._cache.clear();
    }
    _log("debug", key ? `Invalidated: ${key}` : "Cache cleared");
  }
  has(key) {
    return this._getFromCache(key) !== null;
  }
  get size() {
    return this._cache.size;
  }
  get pendingCount() {
    return this._pending.size;
  }
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this._cache) {
      if (now > entry.expiresAt) {
        this._cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) _log("debug", `Cleaned ${cleaned} expired entries`);
    return cleaned;
  }
  healthCheck() {
    const logger = _getPort("logger");
    const hitRate = this._metrics.hits + this._metrics.misses > 0 ? this._metrics.hits / (this._metrics.hits + this._metrics.misses) : 0;
    const checks = { hasCapacity: this._cache.size < this.maxSize, goodHitRate: hitRate > 0.3 || this._metrics.hits + this._metrics.misses < 10, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, hitRate: `${(hitRate * 100).toFixed(1)}%`, size: this._cache.size, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, ttl: this.ttl, maxSize: this.maxSize, currentSize: this._cache.size, pendingRequests: this._pending.size, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { hits: 0, misses: 0, deduped: 0, evictions: 0 };
  }
}
function getVersion() {
  return VERSION;
}
var request_cache_default = RequestCache;
export {
  MODULE_ID,
  RequestCache,
  VERSION,
  request_cache_default as default,
  getPorts,
  getVersion,
  injectPorts
};
