// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Cache Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, cache from ../state.js
//   getCacheKey from ./operations.js
//
// PROVIDES:
//   invalidate() — exported function
//   invalidateAll() — exported function
//   cleanExpired() — exported function
//   getCacheInfo() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { config, cache } from '../state.js';
import { getCacheKey } from './operations.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lazy-loader.cache.management';

export function invalidate(type: DynObj, id: DynObj) {
  const cacheKey = getCacheKey(type, id);
  const deleted = cache.delete(cacheKey);
  return { ok: true, invalidated: deleted };
}

export function invalidateAll() {
  const count = cache.size;
  cache.clear();
  return { ok: true, invalidated: count };
}

export function cleanExpired() {
  const now = Date.now();
  let removed = 0;
  
  for (const [key, value] of cache) {
    if (now - value.timestamp > config.cacheTTL) {
      cache.delete(key);
      removed++;
    }
  }
  
  return { ok: true, removed };
}

export function getCacheInfo() {
  const items = [];
  const now = Date.now();
  
  for (const [key, value] of cache) {
    items.push({
      key,
      age: now - value.timestamp,
      ttlRemaining: Math.max(0, config.cacheTTL - (now - value.timestamp))
    });
  }
  
  return {
    size: cache.size,
    maxSize: config.maxCacheSize,
    items
  };
}
