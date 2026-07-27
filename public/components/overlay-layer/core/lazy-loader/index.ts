// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, LOAD_STATUS from ./constants.js
//   registerLoader, unregisterLoader, getRegisteredLoaders from ./loaders/registry.js
//   load from ./loaders/execute.js
//   prefetch, prefetchMany, getPrefetchQueueInfo, clearPrefetchQueue from ./prefetch/manager.js
//   isCached, getLoadStatus from ./queries.js
//   invalidate, invalidateAll, cleanExpired, getCacheInfo from ./cache/management.js
//   configure, getConfig, getMetrics, resetMetrics, healthCheck, info from ./api.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LOAD_STATUS — exported value
//   registerLoader — exported value
//   unregisterLoader — exported value
//   getRegisteredLoaders — exported value
//   load — exported value
//   prefetch — exported value
//   prefetchMany — exported value
//   getPrefetchQueueInfo — exported value
//   clearPrefetchQueue — exported value
//   isCached — exported value
//   getLoadStatus — exported value
//   invalidate — exported value
//   invalidateAll — exported value
//   cleanExpired — exported value
//   getCacheInfo — exported value
//   configure — exported value
//   getConfig — exported value
//   getMetrics — exported value
//   resetMetrics — exported value
//   healthCheck — exported value
//   info — exported value
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

export { VERSION, MODULE_ID, LOAD_STATUS } from './constants.js';
export { registerLoader, unregisterLoader, getRegisteredLoaders } from './loaders/registry.js';
export { load } from './loaders/execute.js';
export { prefetch, prefetchMany, getPrefetchQueueInfo as getPrefetchQueue, clearPrefetchQueue } from './prefetch/manager.js';
export { isCached, getLoadStatus } from './queries.js';
export { invalidate, invalidateAll, cleanExpired, getCacheInfo } from './cache/management.js';
export { configure, getConfig, getMetrics, resetMetrics, healthCheck, info } from './api.js';

import { VERSION, MODULE_ID, LOAD_STATUS } from './constants.js';
import { registerLoader, unregisterLoader, getRegisteredLoaders } from './loaders/registry.js';
import { load } from './loaders/execute.js';
import { prefetch, prefetchMany, getPrefetchQueueInfo, clearPrefetchQueue } from './prefetch/manager.js';
import { isCached, getLoadStatus } from './queries.js';
import { invalidate, invalidateAll, cleanExpired, getCacheInfo } from './cache/management.js';
import { configure, getConfig, getMetrics, resetMetrics, healthCheck, info } from './api.js';

export default {
  registerLoader,
  unregisterLoader,
  load,
  prefetch,
  prefetchMany,
  isCached,
  getLoadStatus,
  invalidate,
  invalidateAll,
  cleanExpired,
  getCacheInfo,
  getRegisteredLoaders,
  getPrefetchQueue: getPrefetchQueueInfo,
  clearPrefetchQueue,
  configure,
  getConfig,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  LOAD_STATUS,
  VERSION,
  MODULE_ID
};
