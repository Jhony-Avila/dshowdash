// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Prefetch Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, prefetchQueue, setPrefetchQueue, incrementMetric from ../state.js
//   getCacheKey, getFromCache from ../cache/operations.js
//   load from ../loaders/execute.js
//
// PROVIDES:
//   prefetch() — exported function
//   processPrefetchQueue() — exported function
//   prefetchMany() — exported function
//   getPrefetchQueueInfo() — exported function
//   clearPrefetchQueue() — exported function
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

import { config, prefetchQueue, setPrefetchQueue, incrementMetric } from '../state.js';
import { getCacheKey, getFromCache } from '../cache/operations.js';
import { load } from '../loaders/execute.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lazy-loader.prefetch.manager';

export function prefetch(type: DynObj, options: { id?: string } = {}) {
  if (!config.enabled || !config.prefetchEnabled) {
    return { ok: false, skipped: true };
  }
  
  const cacheKey = getCacheKey(type, options.id);
  
  if (getFromCache(cacheKey)) {
    return { ok: true, alreadyCached: true };
  }
  
  if (prefetchQueue.some(p => p.cacheKey === cacheKey)) {
    return { ok: true, alreadyQueued: true };
  }
  
  prefetchQueue.push({
    type,
    options,
    cacheKey,
    queuedAt: Date.now()
  });
  
  setTimeout(() => processPrefetchQueue(), config.prefetchDelay);
  
  return { ok: true, queued: true };
}

export async function processPrefetchQueue() {
  while (prefetchQueue.length > 0) {
    const item = prefetchQueue.shift();
    
    if (!getFromCache(item.cacheKey)) {
      const result = await load(item.type, { ...item.options, skipCache: false });
      if (result.ok) {
        incrementMetric('prefetched');
      }
    }
  }
}

export function prefetchMany(items: DynObj) {
  const results = [];
  
  for (const item of items) {
    const type = typeof item === 'string' ? item : item.type;
    const options = typeof item === 'object' ? item : {};
    results.push(prefetch(type, options));
  }
  
  return { ok: true, queued: results.filter(r => r.queued).length };
}

export function getPrefetchQueueInfo() {
  return prefetchQueue.map(p => ({
    type: p.type,
    cacheKey: p.cacheKey,
    queuedAt: p.queuedAt,
    waitTime: Date.now() - p.queuedAt
  }));
}

export function clearPrefetchQueue() {
  const count = prefetchQueue.length;
  setPrefetchQueue([]);
  return { ok: true, cleared: count };
}
