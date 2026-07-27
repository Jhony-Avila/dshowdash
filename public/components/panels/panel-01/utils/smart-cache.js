const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/smart-cache";
function SmartCache(options = {}) {
  this.maxSize = options.maxSize || 100;
  this.defaultTTL = options.defaultTTL || 3e5;
  this.onEvict = options.onEvict || (() => {
  });
  this.persistKey = options.persistKey || null;
  this._cache = /* @__PURE__ */ new Map();
  this._accessCount = /* @__PURE__ */ new Map();
  this._accessTime = /* @__PURE__ */ new Map();
  this._patterns = /* @__PURE__ */ new Map();
  if (this.persistKey) {
    this._loadFromStorage();
  }
}
SmartCache.prototype.get = function(key) {
  const entry = this._cache.get(key);
  if (!entry) {
    this._recordMiss(key);
    return null;
  }
  if (this._isExpired(entry)) {
    this._cache.delete(key);
    this._recordMiss(key);
    return null;
  }
  this._recordHit(key);
  return entry.value;
};
SmartCache.prototype.set = function(key, value, ttl) {
  if (this._cache.size >= this.maxSize && !this._cache.has(key)) {
    this._evictLRU();
  }
  const entry = {
    value,
    createdAt: Date.now(),
    ttl: ttl || this.defaultTTL,
    size: this._estimateSize(value)
  };
  this._cache.set(key, entry);
  this._accessTime.set(key, Date.now());
  this._accessCount.set(key, (this._accessCount.get(key) || 0) + 1);
  this._persist();
  return this;
};
SmartCache.prototype.has = function(key) {
  const entry = this._cache.get(key);
  return entry && !this._isExpired(entry);
};
SmartCache.prototype.delete = function(key) {
  const deleted = this._cache.delete(key);
  this._accessCount.delete(key);
  this._accessTime.delete(key);
  this._persist();
  return deleted;
};
SmartCache.prototype.clear = function() {
  this._cache.clear();
  this._accessCount.clear();
  this._accessTime.clear();
  this._persist();
};
SmartCache.prototype._isExpired = (entry) => Date.now() - entry.createdAt > entry.ttl;
SmartCache.prototype._evictLRU = function() {
  const self = this;
  let oldestKey = null;
  let oldestTime = Infinity;
  this._accessTime.forEach((time, key) => {
    const score = time - (self._accessCount.get(key) || 1) * 1e3;
    if (score < oldestTime) {
      oldestTime = score;
      oldestKey = key;
    }
  });
  if (oldestKey) {
    const entry = this._cache.get(oldestKey);
    this._cache.delete(oldestKey);
    this._accessCount.delete(oldestKey);
    this._accessTime.delete(oldestKey);
    this.onEvict(oldestKey, entry ? entry.value : null);
  }
};
SmartCache.prototype._recordHit = function(key) {
  this._accessCount.set(key, (this._accessCount.get(key) || 0) + 1);
  this._accessTime.set(key, Date.now());
  this._recordPattern(key, "hit");
};
SmartCache.prototype._recordMiss = function(key) {
  this._recordPattern(key, "miss");
};
SmartCache.prototype._recordPattern = function(key, type) {
  const pattern = this._extractPattern(key);
  if (!this._patterns.has(pattern)) {
    this._patterns.set(pattern, { hits: 0, misses: 0, keys: /* @__PURE__ */ new Set() });
  }
  const stats = this._patterns.get(pattern);
  if (type === "hit") {
    stats.hits++;
  } else {
    stats.misses++;
  }
  stats.keys.add(key);
};
SmartCache.prototype._extractPattern = (key) => (
  // Extract pattern by removing numeric IDs
  key.replace(/\d+/g, "*")
);
SmartCache.prototype._estimateSize = (value) => {
  try {
    return JSON.stringify(value).length;
  } catch (e) {
    return 0;
  }
};
SmartCache.prototype.getOrSet = async function(key, fetchFn, ttl) {
  const cached = this.get(key);
  if (cached !== null) {
    return cached;
  }
  const value = await fetchFn();
  this.set(key, value, ttl);
  return value;
};
SmartCache.prototype.prefetch = function(keys, fetchFn) {
  const self = this;
  const uncached = keys.filter((key) => !self.has(key));
  return Promise.all(uncached.map((key) => fetchFn(key).then((value) => {
    self.set(key, value);
    return { key, value };
  }).catch((error) => ({
    key,
    error
  }))));
};
SmartCache.prototype.invalidatePattern = function(pattern) {
  const self = this;
  const regex = new RegExp(pattern.replace(/\*/g, ".*"));
  const deleted = [];
  this._cache.forEach((value, key) => {
    if (regex.test(key)) {
      self.delete(key);
      deleted.push(key);
    }
  });
  return deleted;
};
SmartCache.prototype.getStats = function() {
  const self = this;
  let totalSize = 0;
  let expired = 0;
  let totalHits = 0;
  this._cache.forEach((entry) => {
    totalSize += entry.size || 0;
    if (self._isExpired(entry)) expired++;
  });
  this._accessCount.forEach((count) => {
    totalHits += count;
  });
  const patternStats = [];
  this._patterns.forEach((stats, pattern) => {
    const hitRate = stats.hits / (stats.hits + stats.misses) * 100;
    patternStats.push({ pattern, hits: stats.hits, misses: stats.misses, hitRate: `${hitRate.toFixed(1)}%` });
  });
  return {
    entries: this._cache.size,
    maxSize: this.maxSize,
    totalSize,
    expired,
    totalHits,
    patterns: patternStats.sort((a, b) => b.hits - a.hits).slice(0, 10)
  };
};
SmartCache.prototype.suggestPrefetch = function() {
  const suggestions = [];
  this._patterns.forEach((stats, pattern) => {
    if (stats.misses > stats.hits && stats.misses > 3) {
      suggestions.push({ pattern, reason: "High miss rate", misses: stats.misses });
    }
  });
  return suggestions.sort((a, b) => b.misses - a.misses);
};
SmartCache.prototype._persist = function() {
  if (!this.persistKey) return;
  try {
    const data = {};
    this._cache.forEach((entry, key) => {
      data[key] = entry;
    });
    localStorage.setItem(this.persistKey, JSON.stringify(data));
  } catch (e) {
  }
};
SmartCache.prototype._loadFromStorage = function() {
  if (!this.persistKey) return;
  try {
    const data = JSON.parse(localStorage.getItem(this.persistKey) || "{}");
    const self = this;
    Object.keys(data).forEach((key) => {
      const entry = data[key];
      if (!self._isExpired(entry)) {
        self._cache.set(key, entry);
        self._accessTime.set(key, Date.now());
      }
    });
  } catch (e) {
  }
};
SmartCache.prototype.destroy = function() {
  this.clear();
  this._patterns.clear();
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var smart_cache_default = { SmartCache, info, healthCheck };
export {
  MODULE_ID,
  SmartCache,
  VERSION,
  smart_cache_default as default,
  healthCheck,
  info
};
