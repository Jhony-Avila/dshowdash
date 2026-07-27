const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/performance/memoize";
class RenderCache {
  constructor(options = {}) {
    this._cache = /* @__PURE__ */ new Map();
    this._maxSize = options.maxSize || 500;
    this._ttl = options.ttl || 6e4;
    this._hits = 0;
    this._misses = 0;
  }
  getKey(item) {
    const id = item.id || item.Id_Requisicao;
    const hash = this._hash(item);
    return `${id}:${hash}`;
  }
  _hash(obj) {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  get(key) {
    const entry = this._cache.get(key);
    if (!entry) {
      this._misses++;
      return null;
    }
    if (Date.now() > entry.expires) {
      this._cache.delete(key);
      this._misses++;
      return null;
    }
    this._hits++;
    entry.lastAccess = Date.now();
    return entry.html;
  }
  set(key, html) {
    if (this._cache.size >= this._maxSize) this._evict();
    this._cache.set(key, { html, created: Date.now(), expires: Date.now() + this._ttl, lastAccess: Date.now() });
  }
  _evict() {
    let oldest = null;
    let oldestKey = null;
    for (const [key, entry] of this._cache) {
      if (!oldest || entry.lastAccess < oldest.lastAccess) {
        oldest = entry;
        oldestKey = key;
      }
    }
    if (oldestKey) this._cache.delete(oldestKey);
  }
  invalidate(id) {
    for (const key of this._cache.keys()) {
      if (key.startsWith(`${id}:`)) this._cache.delete(key);
    }
  }
  clear() {
    this._cache.clear();
    this._hits = 0;
    this._misses = 0;
  }
  getStats() {
    const total = this._hits + this._misses;
    return { size: this._cache.size, maxSize: this._maxSize, hits: this._hits, misses: this._misses, hitRate: total > 0 ? Math.round(this._hits / total * 100) : 0 };
  }
}
function memoizeRow(renderFn, cache) {
  return (item, index, options) => {
    const key = cache.getKey(item);
    let html = cache.get(key);
    if (!html) {
      html = renderFn(item, index, options);
      cache.set(key, html);
    }
    return html;
  };
}
function createMemoizedRenderer(renderFn, options = {}) {
  const cache = new RenderCache(options);
  const memoized = memoizeRow(renderFn, cache);
  memoized.invalidate = (id) => cache.invalidate(id);
  memoized.clear = () => cache.clear();
  memoized.getStats = () => cache.getStats();
  return memoized;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var memoize_default = { RenderCache, memoizeRow, createMemoizedRenderer };
export {
  MODULE_ID,
  RenderCache,
  VERSION,
  createMemoizedRenderer,
  memoize_default as default,
  healthCheck,
  info,
  memoizeRow
};
