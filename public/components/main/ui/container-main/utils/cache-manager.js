import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE5";
const MODULE_ID = "container-main:cache-manager";
const EVICTION_STRATEGIES = Object.freeze({
  LRU: "lru",
  LFU: "lfu",
  FIFO: "fifo",
  TTL: "ttl"
});
function createCacheManager(options = {}) {
  const {
    maxSize = 1e3,
    defaultTTL = 3e5,
    evictionStrategy = EVICTION_STRATEGIES.LRU,
    cleanupInterval = 6e4,
    onEvict = null,
    onHit = null,
    onMiss = null,
    persistToStorage = false,
    storageKey = "cm-cache"
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _cache = /* @__PURE__ */ new Map();
  let _tags = /* @__PURE__ */ new Map();
  let _cleanupTimer = null;
  let _metrics = { hits: 0, misses: 0, sets: 0, evictions: 0, expirations: 0 };
  function _createCacheItem(key, value, options2 = {}) {
    const now = Date.now();
    return {
      key,
      value,
      createdAt: now,
      accessedAt: now,
      expiresAt: options2.ttl ? now + options2.ttl : defaultTTL ? now + defaultTTL : null,
      accessCount: 0,
      tags: options2.tags || [],
      size: _estimateSize(value)
    };
  }
  function _estimateSize(value) {
    if (value === null || value === void 0) return 0;
    if (typeof value === "string") return value.length * 2;
    if (typeof value === "number") return 8;
    if (typeof value === "boolean") return 4;
    if (Array.isArray(value)) return value.length * 50;
    if (typeof value === "object") return JSON.stringify(value).length * 2;
    return 100;
  }
  function _isExpired(item) {
    return item.expiresAt && Date.now() > item.expiresAt;
  }
  function _cleanupExpired() {
    let count = 0;
    for (const [key, item] of _cache) {
      if (_isExpired(item)) {
        _cache.delete(key);
        _removeFromTags(key, item.tags);
        count++;
        _metrics.expirations++;
      }
    }
    if (count > 0) _logger.debug(`Cleaned up ${count} expired items`);
  }
  function _evict() {
    if (_cache.size <= maxSize) return;
    let toRemove = null;
    switch (evictionStrategy) {
      case EVICTION_STRATEGIES.LRU:
        let oldest = Infinity;
        for (const [key, item] of _cache) {
          if (item.accessedAt < oldest) {
            oldest = item.accessedAt;
            toRemove = key;
          }
        }
        break;
      case EVICTION_STRATEGIES.LFU:
        let leastUsed = Infinity;
        for (const [key, item] of _cache) {
          if (item.accessCount < leastUsed) {
            leastUsed = item.accessCount;
            toRemove = key;
          }
        }
        break;
      case EVICTION_STRATEGIES.FIFO:
        let firstCreated = Infinity;
        for (const [key, item] of _cache) {
          if (item.createdAt < firstCreated) {
            firstCreated = item.createdAt;
            toRemove = key;
          }
        }
        break;
      case EVICTION_STRATEGIES.TTL:
        let soonestExpiry = Infinity;
        for (const [key, item] of _cache) {
          if (item.expiresAt && item.expiresAt < soonestExpiry) {
            soonestExpiry = item.expiresAt;
            toRemove = key;
          }
        }
        break;
    }
    if (toRemove) {
      const item = _cache.get(toRemove);
      _cache.delete(toRemove);
      _removeFromTags(toRemove, item?.tags || []);
      _metrics.evictions++;
      onEvict?.({ key: toRemove, reason: "capacity", strategy: evictionStrategy });
      _logger.debug(`Evicted: ${toRemove} (${evictionStrategy})`);
    }
  }
  function _addToTags(key, tags) {
    for (const tag of tags) {
      if (!_tags.has(tag)) _tags.set(tag, /* @__PURE__ */ new Set());
      _tags.get(tag).add(key);
    }
  }
  function _removeFromTags(key, tags) {
    for (const tag of tags) {
      const tagSet = _tags.get(tag);
      if (tagSet) {
        tagSet.delete(key);
        if (tagSet.size === 0) _tags.delete(tag);
      }
    }
  }
  if (cleanupInterval > 0) {
    _cleanupTimer = setInterval(_cleanupExpired, cleanupInterval);
  }
  if (persistToStorage && typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        for (const [key, item] of Object.entries(data)) {
          if (!_isExpired(item)) {
            _cache.set(key, item);
            _addToTags(key, item.tags || []);
          }
        }
        _logger.info(`Loaded ${_cache.size} items from storage`);
      }
    } catch (e) {
      _logger.warn("Failed to load cache from storage:", e);
    }
  }
  const cache = {
    // Define valor
    set(key, value, options2 = {}) {
      while (_cache.size >= maxSize) {
        _evict();
      }
      const item = _createCacheItem(key, value, { ttl: options2.ttl, tags: options2.tags });
      const existing = _cache.get(key);
      if (existing) _removeFromTags(key, existing.tags);
      _cache.set(key, item);
      _addToTags(key, item.tags);
      _metrics.sets++;
      if (persistToStorage) this._persist();
      return this;
    },
    // Obtém valor
    // @ts-expect-error strict migration — TS2322
    get(key, defaultValue = void 0) {
      const item = _cache.get(key);
      if (!item) {
        _metrics.misses++;
        onMiss?.(key);
        return defaultValue;
      }
      if (_isExpired(item)) {
        this.delete(key);
        _metrics.misses++;
        _metrics.expirations++;
        onMiss?.(key);
        return defaultValue;
      }
      item.accessedAt = Date.now();
      item.accessCount++;
      _metrics.hits++;
      onHit?.(key);
      return item.value;
    },
    // Verifica existência
    has(key) {
      const item = _cache.get(key);
      if (!item) return false;
      if (_isExpired(item)) {
        this.delete(key);
        return false;
      }
      return true;
    },
    // Remove
    delete(key) {
      const item = _cache.get(key);
      if (item) {
        _removeFromTags(key, item.tags);
        _cache.delete(key);
        if (persistToStorage) this._persist();
        return true;
      }
      return false;
    },
    // Limpa tudo
    clear() {
      _cache.clear();
      _tags.clear();
      if (persistToStorage && typeof localStorage !== "undefined") {
        localStorage.removeItem(storageKey);
      }
    },
    // Invalida por tag
    invalidateByTag(tag) {
      const keys = _tags.get(tag);
      if (!keys) return 0;
      let count = 0;
      for (const key of keys) {
        if (this.delete(key)) count++;
      }
      _tags.delete(tag);
      _logger.debug(`Invalidated ${count} items by tag: ${tag}`);
      return count;
    },
    // Invalida por padrão
    invalidateByPattern(pattern) {
      const regex = new RegExp(pattern);
      let count = 0;
      for (const key of _cache.keys()) {
        if (regex.test(key)) {
          if (this.delete(key)) count++;
        }
      }
      _logger.debug(`Invalidated ${count} items by pattern: ${pattern}`);
      return count;
    },
    // Get ou Set (memoize)
    getOrSet(key, factory, options2 = {}) {
      if (this.has(key)) {
        return this.get(key);
      }
      const value = typeof factory === "function" ? factory() : factory;
      this.set(key, value, options2);
      return value;
    },
    // Get ou Set async
    async getOrSetAsync(key, factory, options2 = {}) {
      if (this.has(key)) {
        return this.get(key);
      }
      const value = await (typeof factory === "function" ? factory() : factory);
      this.set(key, value, options2);
      return value;
    },
    // Wrap function com cache
    memoize(fn, options2 = {}) {
      const keyGenerator = options2.keyGenerator || ((...args) => JSON.stringify(args));
      const ttl = options2.ttl;
      const tags = options2.tags || [];
      return (...args) => {
        const key = `memoize:${fn.name || "anonymous"}:${keyGenerator(...args)}`;
        return this.getOrSet(key, () => fn(...args), { ttl, tags });
      };
    },
    // Estatísticas
    getStats() {
      let totalSize = 0;
      let oldestItem = Infinity;
      let newestItem = 0;
      for (const item of _cache.values()) {
        totalSize += item.size;
        if (item.createdAt < oldestItem) oldestItem = item.createdAt;
        if (item.createdAt > newestItem) newestItem = item.createdAt;
      }
      return {
        size: _cache.size,
        maxSize,
        totalSizeBytes: totalSize,
        hitRate: _metrics.hits + _metrics.misses > 0 ? `${(_metrics.hits / (_metrics.hits + _metrics.misses) * 100).toFixed(2)}%` : "0%",
        tags: _tags.size,
        oldestItem: oldestItem === Infinity ? null : new Date(oldestItem).toISOString(),
        newestItem: newestItem === 0 ? null : new Date(newestItem).toISOString()
      };
    },
    // Métricas
    getMetrics() {
      return { ..._metrics, ...this.getStats() };
    },
    resetMetrics() {
      _metrics = { hits: 0, misses: 0, sets: 0, evictions: 0, expirations: 0 };
    },
    // Lista keys
    keys() {
      return Array.from(_cache.keys());
    },
    // Lista tags
    listTags() {
      return Array.from(_tags.keys());
    },
    // Persiste no storage
    _persist() {
      if (!persistToStorage || typeof localStorage === "undefined") return;
      try {
        const data = {};
        for (const [key, item] of _cache) {
          if (!_isExpired(item)) data[key] = item;
        }
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        _logger.warn("Failed to persist cache:", e);
      }
    },
    // Health check
    healthCheck() {
      const stats = this.getStats();
      let status = "HEALTHY";
      if (_cache.size > maxSize * 0.9) status = "WARNING";
      if (_cache.size >= maxSize) status = "DEGRADED";
      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        ...stats,
        metrics: _metrics
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        maxSize,
        defaultTTL,
        evictionStrategy,
        cleanupInterval,
        persistToStorage
      };
    },
    // Destroy
    destroy() {
      if (_cleanupTimer) {
        clearInterval(_cleanupTimer);
        _cleanupTimer = null;
      }
      this.clear();
    }
  };
  return cache;
}
let _instance = null;
function getCacheManager(options = {}) {
  if (!_instance) {
    _instance = createCacheManager(options);
  }
  return _instance;
}
function resetCacheManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, strategies: Object.keys(EVICTION_STRATEGIES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var cache_manager_default = {
  VERSION,
  MODULE_ID,
  EVICTION_STRATEGIES,
  createCacheManager,
  getCacheManager,
  resetCacheManager,
  info,
  healthCheck
};
export {
  EVICTION_STRATEGIES,
  MODULE_ID,
  VERSION,
  createCacheManager,
  cache_manager_default as default,
  getCacheManager,
  healthCheck,
  info,
  resetCacheManager
};
