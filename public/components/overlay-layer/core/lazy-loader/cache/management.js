import { config, cache } from "../state.js";
import { getCacheKey } from "./operations.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lazy-loader.cache.management";
function invalidate(type, id) {
  const cacheKey = getCacheKey(type, id);
  const deleted = cache.delete(cacheKey);
  return { ok: true, invalidated: deleted };
}
function invalidateAll() {
  const count = cache.size;
  cache.clear();
  return { ok: true, invalidated: count };
}
function cleanExpired() {
  const now = Date.now();
  let removed = 0;
  for (const [key, value] of cache) {
    if (now - value.timestamp > config.cacheTTL) {
      cache.delete(key);
      removed++;
    }
  }
  return { ok: true, removed };
}
function getCacheInfo() {
  const items = [];
  const now = Date.now();
  for (const [key, value] of cache) {
    items.push({
      key,
      age: now - value.timestamp,
      ttlRemaining: Math.max(0, config.cacheTTL - (now - value.timestamp))
    });
  }
  return {
    size: cache.size,
    maxSize: config.maxCacheSize,
    items
  };
}
export {
  MODULE_ID,
  VERSION,
  cleanExpired,
  getCacheInfo,
  invalidate,
  invalidateAll
};
