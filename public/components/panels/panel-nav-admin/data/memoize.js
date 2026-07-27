import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE2";
const MODULE_ID = "panel-nav-admin.data.memoize";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
class MemoCache {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxSize=500] — Máximo de entradas
   * @param {number} [options.ttl=60000] — TTL padrão em ms (1 min)
   * @param {string} [options.name='default']
   */
  constructor(options = {}) {
    this.name = options.name || "default";
    this.maxSize = options.maxSize || 500;
    this.ttl = options.ttl || 6e4;
    this._cache = /* @__PURE__ */ new Map();
    this._hits = 0;
    this._misses = 0;
  }
  /**
   * Get a cached value by key.
   * @param {string} key
   * @returns {*|undefined}
   */
  get(key) {
    const entry = this._cache.get(key);
    if (!entry) {
      this._misses++;
      return void 0;
    }
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      this._misses++;
      return void 0;
    }
    entry.lastAccess = Date.now();
    this._hits++;
    return entry.value;
  }
  /**
   * Set a cached value.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttl]
   */
  set(key, value, ttl) {
    if (this._cache.size >= this.maxSize && !this._cache.has(key)) {
      this._evictOldest();
    }
    this._cache.set(key, {
      value,
      lastAccess: Date.now(),
      expiresAt: Date.now() + (ttl || this.ttl)
    });
  }
  /**
   * Invalidate a specific key.
   * @param {string} key
   */
  invalidate(key) {
    this._cache.delete(key);
  }
  /** Clear all entries. */
  clear() {
    this._cache.clear();
  }
  /** @private Remove oldest entry by lastAccess */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, entry] of this._cache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    if (oldestKey) this._cache.delete(oldestKey);
  }
  /** @returns {Object} Cache statistics */
  getStats() {
    const total = this._hits + this._misses;
    return {
      name: this.name,
      size: this._cache.size,
      maxSize: this.maxSize,
      hits: this._hits,
      misses: this._misses,
      hitRate: total > 0 ? (this._hits / total * 100).toFixed(1) + "%" : "0%"
    };
  }
}
function _generateKey(args) {
  if (args.length === 0) return "__no_args__";
  if (args.length === 1) {
    const arg = args[0];
    if (typeof arg === "string" || typeof arg === "number") return String(arg);
  }
  return JSON.stringify(args);
}
function memoize(fn, options = {}) {
  const cache = new MemoCache(options);
  const keyFn = options.keyFn || _generateKey;
  const memoized = function(...args) {
    const key = keyFn(args);
    const cached = cache.get(key);
    if (cached !== void 0) return cached;
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  memoized.invalidate = (key) => cache.invalidate(key);
  memoized.getStats = () => cache.getStats();
  return memoized;
}
function createMemoizedRenderer(renderFn, options = {}) {
  const cache = new MemoCache({
    maxSize: options.maxSize || 300,
    ttl: options.ttl || 6e4,
    name: "renderer"
  });
  function _itemHash(item) {
    const subset = {
      id: item.id,
      label: item.label,
      icon: item.icon,
      section: item.section,
      isActive: item.isActive,
      order: item.order,
      minLevel: item.minLevel,
      updatedAt: item.updatedAt
    };
    return JSON.stringify(subset);
  }
  const render = (item) => {
    const id = item.id || item.item_key || "";
    const key = id + ":" + _itemHash(item);
    const cached = cache.get(key);
    if (cached !== void 0) return cached;
    const html = renderFn(item);
    cache.set(key, html);
    return html;
  };
  const invalidate = (itemId) => {
    for (const key of cache._cache.keys()) {
      if (key.startsWith(itemId + ":")) {
        cache.invalidate(key);
      }
    }
  };
  return {
    render,
    invalidate,
    clear: () => cache.clear(),
    getStats: () => cache.getStats()
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var memoize_default = { MemoCache, memoize, createMemoizedRenderer, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  MemoCache,
  VERSION,
  createMemoizedRenderer,
  memoize_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  memoize
};
