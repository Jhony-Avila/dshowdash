// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/smart-cache
// PURPOSE: Panel-01 - Smart Caching
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SmartCache() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/smart-cache';

export function SmartCache(this: any, options: Record<string, unknown> = {}) {
  this.maxSize = options.maxSize || 100;
  this.defaultTTL = options.defaultTTL || 300000; // 5 min
  this.onEvict = options.onEvict || (() => {});
  this.persistKey = options.persistKey || null;
  
  this._cache = new Map();
  this._accessCount = new Map();
  this._accessTime = new Map();
  this._patterns = new Map();
  
  if (this.persistKey) {
    this._loadFromStorage();
  }
}

SmartCache.prototype.get = function(key: string) {
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

SmartCache.prototype.set = function(key: string, value: unknown, ttl?: number) {
  // Evict if at capacity
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

SmartCache.prototype.has = function(key: string) {
  const entry = this._cache.get(key);
  return entry && !this._isExpired(entry);
};

SmartCache.prototype.delete = function(key: string) {
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

SmartCache.prototype._isExpired = (entry: Record<string, number>) => Date.now() - entry.createdAt > entry.ttl;

SmartCache.prototype._evictLRU = function() {
  const self = this;
  let oldestKey = null;
  let oldestTime = Infinity;
  
  this._accessTime.forEach((time: number, key: string) => {
    // Consider both access time and access frequency
    const score = time - (self._accessCount.get(key) || 1) * 1000;
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

SmartCache.prototype._recordHit = function(key: string) {
  this._accessCount.set(key, (this._accessCount.get(key) || 0) + 1);
  this._accessTime.set(key, Date.now());
  this._recordPattern(key, 'hit');
};

SmartCache.prototype._recordMiss = function(key: string) {
  this._recordPattern(key, 'miss');
};

SmartCache.prototype._recordPattern = function(key: string, type: string) {
  const pattern = this._extractPattern(key);
  if (!this._patterns.has(pattern)) {
    this._patterns.set(pattern, { hits: 0, misses: 0, keys: new Set() });
  }
  const stats = this._patterns.get(pattern);
  if (type === 'hit') {
    stats.hits++;
  } else {
    stats.misses++;
  }
  stats.keys.add(key);
};

SmartCache.prototype._extractPattern = (key: string) => // Extract pattern by removing numeric IDs
key.replace(/\d+/g, '*');

SmartCache.prototype._estimateSize = (value: unknown) => {
  try {
    return JSON.stringify(value).length;
  } catch (e) {
    return 0;
  }
};

SmartCache.prototype.getOrSet = async function(key: string, fetchFn: () => Promise<unknown>, ttl?: number) {
  const cached = this.get(key);
  if (cached !== null) {
    return cached;
  }
  
  const value = await fetchFn();
  this.set(key, value, ttl);
  return value;
};

SmartCache.prototype.prefetch = function(keys: string[], fetchFn: (key: string) => Promise<unknown>) {
  const self = this;
  const uncached = keys.filter((key: string) => !self.has(key));

  return Promise.all(uncached.map((key: string) => fetchFn(key).then((value: unknown) => {
    self.set(key, value);
    return { key, value };
  }).catch(error => ({
    key,
    error
  }))));
};

SmartCache.prototype.invalidatePattern = function(pattern: string) {
  const self = this;
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  const deleted: string[] = [];

  this._cache.forEach((value: unknown, key: string) => {
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
  
  this._cache.forEach((entry: Record<string, number>) => {
    totalSize += entry.size || 0;
    if (self._isExpired(entry)) expired++;
  });
  
  this._accessCount.forEach((count: number) => {
    totalHits += count;
  });

  const patternStats: Record<string, unknown>[] = [];
  this._patterns.forEach((stats: Record<string, number>, pattern: string) => {
    const hitRate = stats.hits / (stats.hits + stats.misses) * 100;
    patternStats.push({ pattern, hits: stats.hits, misses: stats.misses, hitRate: `${hitRate.toFixed(1)}%` });
  });
  
  return {
    entries: this._cache.size,
    maxSize: this.maxSize,
    totalSize,
    expired,
    totalHits,
    patterns: patternStats.sort((a, b) => (b.hits as number) - (a.hits as number)).slice(0, 10)
  };
};

SmartCache.prototype.suggestPrefetch = function() {
  const suggestions: Record<string, unknown>[] = [];

  this._patterns.forEach((stats: Record<string, number>, pattern: string) => {
    if (stats.misses > stats.hits && stats.misses > 3) {
      suggestions.push({ pattern, reason: 'High miss rate', misses: stats.misses });
    }
  });
  
  return suggestions.sort((a, b) => (b.misses as number) - (a.misses as number));
};

SmartCache.prototype._persist = function() {
  if (!this.persistKey) return;
  
  try {
    const data = {};
    this._cache.forEach((entry: unknown, key: string) => {
      (data as Record<string, unknown>)[key] = entry;
    });
    localStorage.setItem(this.persistKey, JSON.stringify(data));
  } catch (e) {}
};

SmartCache.prototype._loadFromStorage = function() {
  if (!this.persistKey) return;
  
  try {
    const data = JSON.parse(localStorage.getItem(this.persistKey) || '{}');
    const self = this;
    Object.keys(data).forEach(key => {
      const entry = data[key];
      if (!self._isExpired(entry)) {
        self._cache.set(key, entry);
        self._accessTime.set(key, Date.now());
      }
    });
  } catch (e) {}
};

SmartCache.prototype.destroy = function() {
  this.clear();
  this._patterns.clear();
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { SmartCache, info, healthCheck };
