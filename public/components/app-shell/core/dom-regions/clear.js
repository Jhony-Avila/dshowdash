import { REGION_MAP } from "./constants.js";
import { regionCache, cacheHits } from "./cache.js";
import { getRegion } from "./core.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.dom-regions.clear";
function clearRegion(name) {
  const region = getRegion(name);
  if (region) region.innerHTML = "";
}
function clearAllRegions() {
  const keys = Object.keys(REGION_MAP);
  for (let i = 0; i < keys.length; i++) {
    clearRegion(keys[i]);
  }
}
function clearCache() {
  regionCache.clear();
  cacheHits.hits = 0;
  cacheHits.misses = 0;
  cacheHits.expired = 0;
  cacheHits.evictions = 0;
}
function invalidateCache(name) {
  if (name) {
    return regionCache.delete(name);
  }
  clearCache();
  return true;
}
export {
  MODULE_ID,
  VERSION,
  clearAllRegions,
  clearCache,
  clearRegion,
  invalidateCache
};
