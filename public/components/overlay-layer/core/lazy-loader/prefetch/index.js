const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lazy-loader.prefetch";
import { prefetch, prefetchMany, processPrefetchQueue, getPrefetchQueueInfo, clearPrefetchQueue } from "./manager.js";
export {
  MODULE_ID,
  VERSION,
  clearPrefetchQueue,
  getPrefetchQueueInfo,
  prefetch,
  prefetchMany,
  processPrefetchQueue
};
