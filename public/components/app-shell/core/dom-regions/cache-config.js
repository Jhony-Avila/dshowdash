import {
  cacheConfig,
  regionCache,
  cacheHits,
  startAutoCleanup,
  stopAutoCleanup,
  cleanupInterval
} from "./cache.js";
const VERSION = "4.3.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.dom-regions.cache-config";
function setCacheTTL(ttlMs) {
  cacheConfig.ttlMs = Math.max(1e3, Math.min(3e5, ttlMs));
}
function getCacheTTL() {
  return cacheConfig.ttlMs;
}
function setCacheConfig(options) {
  if (options.ttlMs !== void 0) {
    cacheConfig.ttlMs = Math.max(1e3, Math.min(3e5, options.ttlMs));
  }
  if (options.maxSize !== void 0) {
    cacheConfig.maxSize = Math.max(10, Math.min(200, options.maxSize));
  }
  if (options.autoCleanup !== void 0) {
    cacheConfig.autoCleanup = !!options.autoCleanup;
    if (cacheConfig.autoCleanup) {
      startAutoCleanup();
    } else {
      stopAutoCleanup();
    }
  }
  if (options.cleanupIntervalMs !== void 0) {
    cacheConfig.cleanupIntervalMs = Math.max(1e4, options.cleanupIntervalMs);
    if (cleanupInterval.value) {
      stopAutoCleanup();
      startAutoCleanup();
    }
  }
}
function getCacheConfig() {
  return {
    ttlMs: cacheConfig.ttlMs,
    maxSize: cacheConfig.maxSize,
    autoCleanup: cacheConfig.autoCleanup,
    cleanupIntervalMs: cacheConfig.cleanupIntervalMs
  };
}
function getCacheStats() {
  return {
    size: regionCache.size,
    maxSize: cacheConfig.maxSize,
    ttlMs: cacheConfig.ttlMs,
    hits: cacheHits.hits,
    misses: cacheHits.misses,
    expired: cacheHits.expired,
    evictions: cacheHits.evictions,
    hitRate: cacheHits.hits + cacheHits.misses > 0 ? `${Math.round(cacheHits.hits / (cacheHits.hits + cacheHits.misses) * 100)}%` : "N/A"
  };
}
export {
  MODULE_ID,
  VERSION,
  getCacheConfig,
  getCacheStats,
  getCacheTTL,
  setCacheConfig,
  setCacheTTL
};
