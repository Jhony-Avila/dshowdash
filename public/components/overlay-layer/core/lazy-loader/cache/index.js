const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lazy-loader.cache";
import { getCacheKey, getFromCache, addToCache } from "./operations.js";
import { invalidate, invalidateAll, cleanExpired, getCacheInfo } from "./management.js";
export {
  MODULE_ID,
  VERSION,
  addToCache,
  cleanExpired,
  getCacheInfo,
  getCacheKey,
  getFromCache,
  invalidate,
  invalidateAll
};
