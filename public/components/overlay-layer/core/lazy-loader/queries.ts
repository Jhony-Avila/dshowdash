// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Queries
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LOAD_STATUS from ./constants.js
//   prefetchQueue from ./state.js
//   getCacheKey, getFromCache from ./cache/operations.js
//
// PROVIDES:
//   isCached() — exported function
//   getLoadStatus() — exported function
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

import { LOAD_STATUS } from './constants.js';
import { prefetchQueue } from './state.js';
import { getCacheKey, getFromCache } from './cache/operations.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lazy-loader.queries';

export function isCached(type: DynObj, id: DynObj) {
  const cacheKey = getCacheKey(type, id);
  return !!getFromCache(cacheKey);
}

export function getLoadStatus(type: DynObj, id: DynObj) {
  const cacheKey = getCacheKey(type, id);
  
  if (getFromCache(cacheKey)) {
    return LOAD_STATUS.LOADED;
  }
  
  if (prefetchQueue.some(p => p.cacheKey === cacheKey)) {
    return LOAD_STATUS.LOADING;
  }
  
  return LOAD_STATUS.IDLE;
}
