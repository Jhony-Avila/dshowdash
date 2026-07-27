import { LOAD_STATUS } from "./constants.js";
import { prefetchQueue } from "./state.js";
import { getCacheKey, getFromCache } from "./cache/operations.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lazy-loader.queries";
function isCached(type, id) {
  const cacheKey = getCacheKey(type, id);
  return !!getFromCache(cacheKey);
}
function getLoadStatus(type, id) {
  const cacheKey = getCacheKey(type, id);
  if (getFromCache(cacheKey)) {
    return LOAD_STATUS.LOADED;
  }
  if (prefetchQueue.some((p) => p.cacheKey === cacheKey)) {
    return LOAD_STATUS.LOADING;
  }
  return LOAD_STATUS.IDLE;
}
export {
  MODULE_ID,
  VERSION,
  getLoadStatus,
  isCached
};
