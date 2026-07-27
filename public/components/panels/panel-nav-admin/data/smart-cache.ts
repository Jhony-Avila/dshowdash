

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE2)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.smart-cache
// PURPOSE: Smart Cache — Cache inteligente com TTL, LRU eviction e analytics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   injectPorts(), getPorts()
//   SmartCache — exported class
//   createSmartCache() — factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/smart-cache.js for nav-admin data
// @changelog
//   10.1.0-MIGRATION-PHASE2: Initial creation — FASE 2 C.2
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE2';
export const MODULE_ID = 'panel-nav-admin.data.smart-cache';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[SmartCache]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'warn') logger.warn?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * SmartCache — Cache com TTL, LRU eviction e analytics por padrão.
 */
export class SmartCache {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {number} [options.maxSize=200] — Máximo de entradas
   * @param {number} [options.ttl=300000] — TTL padrão em ms (5 min)
   * @param {string} [options.storageKey] — Chave localStorage para persistência
   * @param {string} [options.name='default'] — Nome do cache
   */
  constructor(options: Record<string, unknown> = {}) {
    this.name = options.name || 'default';
    this.maxSize = options.maxSize || 200;
    this.defaultTTL = options.ttl || 300000;
    this.storageKey = options.storageKey || null;

    this._cache = new Map();
    this._hits = 0;
    this._misses = 0;
    this._evictions = 0;
    this._patternStats = new Map();

    if (this.storageKey) this._loadFromStorage();
  }

  /**
   * Get a cached value.
   * @param {string} key
   * @returns {*|undefined} Cached value or undefined if missing/expired
   */
  get(key: string) {
    const entry = this._cache.get(key);
    if (!entry) {
      this._misses++;
      this._trackPattern(key, 'miss');
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      this._misses++;
      this._trackPattern(key, 'miss');
      return undefined;
    }

    entry.lastAccess = Date.now();
    entry.accessCount++;
    this._hits++;
    this._trackPattern(key, 'hit');
    return entry.value;
  }

  /**
   * Set a cached value.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttl] — Custom TTL in ms (overrides default)
   */
  set(key: string, value: unknown, ttl?: number) {
    if (this._cache.size >= this.maxSize && !this._cache.has(key)) {
      this._evictLRU();
    }

    this._cache.set(key, {
      value,
      createdAt: Date.now(),
      lastAccess: Date.now(),
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      accessCount: 0
    });

    if (this.storageKey) this._saveToStorage();
  }

  /**
   * Get or set — returns cached value if present, otherwise calls factory and caches result.
   * @param {string} key
   * @param {Function} factory — Called if key is not cached; receives key
   * @param {number} [ttl]
   * @returns {Promise<*>}
   */
  async getOrSet(key: string, factory: (key: string) => Promise<unknown>, ttl?: number) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const value = await factory(key);
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Check if a key exists and is not expired.
   * @param {string} key
   * @returns {boolean}
   */
  has(key: string) {
    const entry = this._cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a specific key.
   * @param {string} key
   * @returns {boolean}
   */
  delete(key: string) {
    const deleted = this._cache.delete(key);
    if (deleted && this.storageKey) this._saveToStorage();
    return deleted;
  }

  /**
   * Invalidate all keys matching a pattern (string includes or regex).
   * @param {string|RegExp} pattern
   * @returns {number} Number of keys invalidated
   */
  invalidatePattern(pattern: string | RegExp) {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this._cache.keys()) {
      if (regex.test(key)) {
        this._cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      _log('debug', `Invalidated ${count} entries matching pattern`);
      if (this.storageKey) this._saveToStorage();
    }
    return count;
  }

  /** Clear all cached entries. */
  clear() {
    this._cache.clear();
    if (this.storageKey) this._saveToStorage();
    _log('debug', 'Cache cleared');
  }

  /** Remove all expired entries. */
  prune() {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this._cache) {
      if (now > entry.expiresAt) {
        this._cache.delete(key);
        pruned++;
      }
    }
    if (pruned > 0) _log('debug', `Pruned ${pruned} expired entries`);
    return pruned;
  }

  /** @private Evict least recently used entry */
  _evictLRU() {
    let oldestKey = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this._cache) {
      const score = entry.lastAccess - (entry.accessCount * 1000);
      if (score < oldestAccess) {
        oldestAccess = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this._cache.delete(oldestKey);
      this._evictions++;
    }
  }

  /** @private Track hit/miss by pattern (digits replaced with *) */
  _trackPattern(key: string, type: string) {
    const pattern = key.replace(/\d+/g, '*');
    if (!this._patternStats.has(pattern)) {
      this._patternStats.set(pattern, { hits: 0, misses: 0 });
    }
    const stats = this._patternStats.get(pattern);
    if (type === 'hit') stats.hits++;
    else stats.misses++;
  }

  /** @private Load from localStorage */
  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      const now = Date.now();
      for (const [key, entry] of Object.entries(data)) {

        // @ts-expect-error TS migration - TS2339
        if (now < entry.expiresAt) {
          this._cache.set(key, entry);
        }
      }
    } catch (e) { /* ignore corrupted storage */ }
  }

  /** @private Save to localStorage */
  _saveToStorage() {
    try {
      const obj: Record<string, unknown> = {};
      for (const [key, entry] of this._cache) {
        obj[key] = entry;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(obj));
    } catch (e) { /* quota exceeded or unavailable */ }
  }

  /**
   * Get cache statistics.
   * @returns {Object}
   */
  getStats() {
    const total = this._hits + this._misses;
    return {
      name: this.name,
      size: this._cache.size,
      maxSize: this.maxSize,
      hits: this._hits,
      misses: this._misses,
      hitRate: total > 0 ? ((this._hits / total) * 100).toFixed(1) + '%' : '0%',
      evictions: this._evictions,
      patternStats: Object.fromEntries(this._patternStats)
    };
  }

  /**
   * Suggest keys to prefetch based on high miss rates.
   * @param {number} [minMisses=3]
   * @returns {string[]} Patterns with high miss rates
   */
  suggestPrefetch(minMisses = 3) {
    const suggestions = [];
    for (const [pattern, stats] of this._patternStats) {
      if (stats.misses >= minMisses && stats.hits < stats.misses) {
        suggestions.push(pattern);
      }
    }
    return suggestions;
  }
}

/**
 * Factory to create a SmartCache instance.
 * @param {Object} [options]
 * @returns {SmartCache}
 */
export function createSmartCache(options: Record<string, unknown> = {}) {
  return new SmartCache(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { SmartCache, createSmartCache, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
