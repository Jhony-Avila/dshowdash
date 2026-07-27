// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-config-cache
// PURPOSE: Container-Main Config Cache
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   set() — exported function
//   get() — exported function
//   has() — exported function
//   remove() — exported function
//   clear() — exported function
//   getOrSet() — exported function
//   memoize() — exported function
//   memoizeAsync() — exported function
//   prune() — exported function
//   getStats() — exported function
//   resetStats() — exported function
//   keys() — exported function
//   size() — exported function
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

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-config-cache';

const _cache = new Map();
const _ttls = new Map();
const _hits = { total: 0, hit: 0, miss: 0 };

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function set(key: string, value: unknown, ttlMs = DEFAULT_TTL) {
  if (typeof key !== 'string') return false;
  _cache.set(key, value);
  if (ttlMs > 0) {
    _ttls.set(key, Date.now() + ttlMs);
  } else {
    _ttls.delete(key);
  }
  return true;
}

// @ts-expect-error strict migration — TS2322
export function get(key: string, defaultValue: string = undefined) {
  _hits.total++;
  
  if (!_cache.has(key)) {
    _hits.miss++;
    return defaultValue;
  }
  
  // Check TTL
  const expiry = _ttls.get(key);
  if (expiry && Date.now() > expiry) {
    _cache.delete(key);
    _ttls.delete(key);
    _hits.miss++;
    return defaultValue;
  }
  
  _hits.hit++;
  return _cache.get(key);
}

export function has(key: string) {
  if (!_cache.has(key)) return false;
  const expiry = _ttls.get(key);
  if (expiry && Date.now() > expiry) {
    _cache.delete(key);
    _ttls.delete(key);
    return false;
  }
  return true;
}

export function remove(key: string) {
  const existed = _cache.has(key);
  _cache.delete(key);
  _ttls.delete(key);
  return existed;
}

export function clear() {
  const count = _cache.size;
  _cache.clear();
  _ttls.clear();
  return count;
}

export function getOrSet(key: string, factory: (...args: unknown[]) => void, ttlMs = DEFAULT_TTL) {
  if (has(key)) {
    return get(key);
  }
  const value = typeof factory === 'function' ? factory() : factory;
  set(key, value, ttlMs);
  return value;
}

export async function getOrSetAsync(key: string, asyncFactory: unknown, ttlMs = DEFAULT_TTL) {
  if (has(key)) {
    return get(key);
  }
  const value = await (asyncFactory as (...args: unknown[]) => unknown)();
  set(key, value, ttlMs);
  return value;
}

export function memoize(fn: (...args: unknown[]) => void, keyFn = (...args: unknown[]) => JSON.stringify(args), ttlMs = DEFAULT_TTL) {
  return (...args: unknown[]) => {
    const key = `memoize:${fn.name || 'anon'}:${keyFn(...args)}`;
    return getOrSet(key, () => fn(...args), ttlMs);
  };
}

export function memoizeAsync(fn: (...args: unknown[]) => void, keyFn = (...args: unknown[]) => JSON.stringify(args), ttlMs = DEFAULT_TTL) {
  return async (...args: unknown[]) => {
    const key = `memoize:${fn.name || 'anon'}:${keyFn(...args)}`;
    return getOrSetAsync(key, () => fn(...args), ttlMs);
  };
}

export function prune() {
  const now = Date.now();
  let pruned = 0;
  _ttls.forEach((expiry, key) => {
    if (now > expiry) {
      _cache.delete(key);
      _ttls.delete(key);
      pruned++;
    }
  });
  return pruned;
}

export function getStats() {
  return {
    size: _cache.size,
    hitRate: _hits.total > 0 ? Math.round((_hits.hit / _hits.total) * 100) : 0,
    hits: _hits.hit,
    misses: _hits.miss,
    total: _hits.total
  };
}

export function resetStats() {
  _hits.total = 0;
  _hits.hit = 0;
  _hits.miss = 0;
}

export function keys() {
  return [..._cache.keys()];
}

export function size() {
  return _cache.size;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, ...getStats() };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, ...getStats() };
}

export default {
  set, get, has, remove, clear, getOrSet, getOrSetAsync,
  memoize, memoizeAsync, prune, getStats, resetStats, keys, size,
  info, healthCheck, VERSION, MODULE_ID
};
