// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE2)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.memoize
// PURPOSE: Memoization — Cache de resultados de funções puras
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   injectPorts(), getPorts()
//   MemoCache — exported class
//   memoize() — exported function (decorator)
//   createMemoizedRenderer() — exported function (HTML render cache)
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/performance/memoize.js for nav-admin
// @changelog
//   10.1.0-MIGRATION-PHASE2: Initial creation — FASE 2 C.11
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE2';
export const MODULE_ID = 'panel-nav-admin.data.memoize';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

/**
 * MemoCache — Cache LRU com TTL para resultados de funções.
 */
export class MemoCache {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {number} [options.maxSize=500] — Máximo de entradas
   * @param {number} [options.ttl=60000] — TTL padrão em ms (1 min)
   * @param {string} [options.name='default']
   */
  constructor(options: Record<string, unknown> = {}) {
    this.name = (options.name as string) || 'default';
    this.maxSize = (options.maxSize as number) || 500;
    this.ttl = (options.ttl as number) || 60000;
    this._cache = new Map();
    this._hits = 0;
    this._misses = 0;
  }

  /**
   * Get a cached value by key.
   * @param {string} key
   * @returns {*|undefined}
   */
  get(key: string) {
    const entry = this._cache.get(key);
    if (!entry) { this._misses++; return undefined; }
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      this._misses++;
      return undefined;
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
  set(key: string, value: unknown, ttl?: number) {
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
  invalidate(key: string) { this._cache.delete(key); }

  /** Clear all entries. */
  clear() { this._cache.clear(); }

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
      hitRate: total > 0 ? ((this._hits / total) * 100).toFixed(1) + '%' : '0%'
    };
  }
}

/**
 * Generate a cache key from function arguments.
 * @private
 * @param {Array} args
 * @returns {string}
 */
function _generateKey(args: unknown[]) {
  if (args.length === 0) return '__no_args__';
  if (args.length === 1) {
    const arg = args[0];
    if (typeof arg === 'string' || typeof arg === 'number') return String(arg);
  }
  return JSON.stringify(args);
}

/**
 * Memoize decorator — wraps a function with caching.
 * @param {Function} fn — Pure function to memoize
 * @param {Object} [options]
 * @param {number} [options.maxSize=500]
 * @param {number} [options.ttl=60000]
 * @param {Function} [options.keyFn] — Custom key generator (receives args array)
 * @returns {Function} Memoized function with .cache (MemoCache), .clear(), .getStats()
 */
export function memoize(fn: (...args: unknown[]) => unknown, options: Record<string, unknown> = {}) {
  const cache = new MemoCache(options);
  const keyFn = (options.keyFn as (args: unknown[]) => string) || _generateKey;

  const memoized = function (this: any, ...args: unknown[]) {
    const key = keyFn(args);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const result = fn.apply(this, args);

    cache.set(key, result);
    return result;
  };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  memoized.invalidate = (key: string) => cache.invalidate(key);
  memoized.getStats = () => cache.getStats();
  return memoized;
}

/**
 * Create a memoized HTML renderer for nav items.
 * Uses item ID + JSON hash as cache key.
 * @param {Function} renderFn — (item) => HTML string
 * @param {Object} [options]
 * @param {number} [options.maxSize=300]
 * @param {number} [options.ttl=60000]
 * @returns {{ render: Function, invalidate: Function, clear: Function, getStats: Function }}
 */
export function createMemoizedRenderer(renderFn: (item: Record<string, unknown>) => string, options: Record<string, unknown> = {}) {
  const cache = new MemoCache({
    maxSize: options.maxSize || 300,
    ttl: options.ttl || 60000,
    name: 'renderer'
  });

  function _itemHash(item: Record<string, unknown>) {
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

  const render = (item: Record<string, unknown>) => {
    const id = item.id || item.item_key || '';
    const key = id + ':' + _itemHash(item);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const html = renderFn(item);

    cache.set(key, html);
    return html;
  };

  const invalidate = (itemId: string) => {
    for (const key of cache._cache.keys()) {
      if (key.startsWith(itemId + ':')) {
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

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { MemoCache, memoize, createMemoizedRenderer, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
