// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Execute
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, incrementMetric from ../state.js
//   getCacheKey, getFromCache, addToCache from ../cache/operations.js
//   findLoader from ./registry.js
//
// PROVIDES:
//   loadWithRetry() — exported function
//   load() — exported function
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

import { config, incrementMetric } from '../state.js';
import { getCacheKey, getFromCache, addToCache } from '../cache/operations.js';
import { findLoader } from './registry.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lazy-loader.loaders.execute';

export async function loadWithRetry(loader: DynObj, context: DynObj, attempts = 0) {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Load timeout')), config.timeout);
    });
    
    const loadPromise = Promise.resolve(loader(context));
    
    const result = await Promise.race([loadPromise, timeoutPromise]);
    return { ok: true, data: result };
    
  } catch (error: any) {
    if (attempts < config.retryAttempts) {
      await new Promise(r => setTimeout(r, config.retryDelay * (attempts + 1)));
      return loadWithRetry(loader, context, attempts + 1);
    }
    return { ok: false, error: error.message };
  }
}

export async function load(type: DynObj, options: { id?: string; skipCache?: boolean } = {}) {
  if (!config.enabled) {
    return { ok: false, error: 'lazy-loader-disabled' };
  }
  
  incrementMetric('totalLoads');
  
  const cacheKey = getCacheKey(type, options.id);
  
  if (!options.skipCache) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return { ok: true, data: cached, fromCache: true };
    }
  }
  
  incrementMetric('cacheMisses');
  
  const loader = findLoader(type);
  if (!loader) {
    return { ok: false, error: 'no-loader-registered', type };
  }
  
  const result = await loadWithRetry(loader, { type, ...options });
  
  if (result.ok) {
    addToCache(cacheKey, result.data);
    return { ok: true, data: result.data, fromCache: false };
  }
  
  incrementMetric('errors');
  return { ok: false, error: result.error };
}
