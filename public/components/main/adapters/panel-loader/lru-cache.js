const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "lru-cache";
class LRUCache {
  _cache;
  _maxSize;
  _ttlMs;
  _hits;
  _misses;
  constructor(maxSize = 20, ttlMs = 5 * 60 * 1e3) {
    this._cache = /* @__PURE__ */ new Map();
    this._maxSize = maxSize;
    this._ttlMs = ttlMs;
    this._hits = 0;
    this._misses = 0;
  }
  get(key) {
    const entry = this._cache.get(key);
    if (!entry) {
      this._misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      this._misses++;
      return null;
    }
    this._hits++;
    this._cache.delete(key);
    this._cache.set(key, entry);
    return entry.value;
  }
  set(key, value, ttlMs = this._ttlMs) {
    if (this._cache.has(key)) this._cache.delete(key);
    else if (this._cache.size >= this._maxSize) {
      const oldestKey = this._cache.keys().next().value;
      this._cache.delete(oldestKey);
    }
    this._cache.set(key, { value, expiresAt: Date.now() + ttlMs, loadedAt: Date.now() });
  }
  has(key) {
    const entry = this._cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return false;
    }
    return true;
  }
  delete(key) {
    return this._cache.delete(key);
  }
  clear() {
    this._cache.clear();
    this._hits = 0;
    this._misses = 0;
  }
  get size() {
    return this._cache.size;
  }
  keys() {
    return Array.from(this._cache.keys());
  }
  getStats() {
    const total = this._hits + this._misses;
    return { size: this._cache.size, maxSize: this._maxSize, ttlMs: this._ttlMs, hits: this._hits, misses: this._misses, hitRate: total > 0 ? Math.round(this._hits / total * 100) : 0 };
  }
  resetStats() {
    this._hits = 0;
    this._misses = 0;
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, stats: this.getStats() };
  }
  healthCheck() {
    return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { cacheReady: true }, stats: this.getStats() };
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { lruCacheReady: true } };
}
var lru_cache_default = LRUCache;
export {
  LRUCache,
  MODULE_ID,
  VERSION,
  lru_cache_default as default,
  healthCheck,
  info
};
