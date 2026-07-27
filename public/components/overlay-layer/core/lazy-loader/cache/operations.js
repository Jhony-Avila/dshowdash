import { config, cache, metrics } from "../state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lazy-loader.cache.operations";
function getCacheKey(type, id) {
  return `${type}:${id || "default"}`;
}
function getFromCache(cacheKey) {
  if (!config.cacheEnabled) return null;
  const cached = cache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > config.cacheTTL) {
    cache.delete(cacheKey);
    return null;
  }
  metrics.cacheHits++;
  return cached.data;
}
function addToCache(cacheKey, data) {
  if (!config.cacheEnabled) return;
  if (cache.size >= config.maxCacheSize) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}
export {
  MODULE_ID,
  VERSION,
  addToCache,
  getCacheKey,
  getFromCache
};
