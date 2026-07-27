import { VERSION, MODULE_ID, LOAD_STATUS } from "./constants.js";
import { registerLoader, unregisterLoader, getRegisteredLoaders } from "./loaders/registry.js";
import { load } from "./loaders/execute.js";
import { prefetch, prefetchMany, getPrefetchQueueInfo, clearPrefetchQueue } from "./prefetch/manager.js";
import { isCached, getLoadStatus } from "./queries.js";
import { invalidate, invalidateAll, cleanExpired, getCacheInfo } from "./cache/management.js";
import { configure, getConfig, getMetrics, resetMetrics, healthCheck, info } from "./api.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, LOAD_STATUS as LOAD_STATUS2 } from "./constants.js";
import { registerLoader as registerLoader2, unregisterLoader as unregisterLoader2, getRegisteredLoaders as getRegisteredLoaders2 } from "./loaders/registry.js";
import { load as load2 } from "./loaders/execute.js";
import { prefetch as prefetch2, prefetchMany as prefetchMany2, getPrefetchQueueInfo as getPrefetchQueueInfo2, clearPrefetchQueue as clearPrefetchQueue2 } from "./prefetch/manager.js";
import { isCached as isCached2, getLoadStatus as getLoadStatus2 } from "./queries.js";
import { invalidate as invalidate2, invalidateAll as invalidateAll2, cleanExpired as cleanExpired2, getCacheInfo as getCacheInfo2 } from "./cache/management.js";
import { configure as configure2, getConfig as getConfig2, getMetrics as getMetrics2, resetMetrics as resetMetrics2, healthCheck as healthCheck2, info as info2 } from "./api.js";
var lazy_loader_default = {
  registerLoader: registerLoader2,
  unregisterLoader: unregisterLoader2,
  load: load2,
  prefetch: prefetch2,
  prefetchMany: prefetchMany2,
  isCached: isCached2,
  getLoadStatus: getLoadStatus2,
  invalidate: invalidate2,
  invalidateAll: invalidateAll2,
  cleanExpired: cleanExpired2,
  getCacheInfo: getCacheInfo2,
  getRegisteredLoaders: getRegisteredLoaders2,
  getPrefetchQueue: getPrefetchQueueInfo2,
  clearPrefetchQueue: clearPrefetchQueue2,
  configure: configure2,
  getConfig: getConfig2,
  getMetrics: getMetrics2,
  resetMetrics: resetMetrics2,
  healthCheck: healthCheck2,
  info: info2,
  LOAD_STATUS: LOAD_STATUS2,
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2
};
export {
  LOAD_STATUS,
  MODULE_ID,
  VERSION,
  cleanExpired,
  clearPrefetchQueue,
  configure,
  lazy_loader_default as default,
  getCacheInfo,
  getConfig,
  getLoadStatus,
  getMetrics,
  getPrefetchQueueInfo as getPrefetchQueue,
  getRegisteredLoaders,
  healthCheck,
  info,
  invalidate,
  invalidateAll,
  isCached,
  load,
  prefetch,
  prefetchMany,
  registerLoader,
  resetMetrics,
  unregisterLoader
};
