// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Cache Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, cache, metrics from ../state.js
//
// PROVIDES:
//   getCacheKey() — exported function
//   getFromCache() — exported function
//   addToCache() — exported function
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

import { config, cache, metrics } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lazy-loader.cache.operations';

export function getCacheKey(type: DynObj, id: DynObj) {
  return `${type}:${id || 'default'}`;
}

export function getFromCache(cacheKey: string) {
  if (!config.cacheEnabled) return null;
  
  const cached = cache.get(cacheKey);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > config.cacheTTL) {
    cache.delete(cacheKey);
    return null;
  }
  
  metrics.cacheHits++;
  return cached.data;
}

export function addToCache(cacheKey: string, data: DynObj) {
  if (!config.cacheEnabled) return;
  
  if (cache.size >= config.maxCacheSize) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}
