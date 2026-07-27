import { getConfig, getCache, setCache, getCacheMetadata, updateCacheMetadata, incrementMetric } from "../state.js";
import { _log } from "../helpers/logger.js";
import { _saveCacheMetadata } from "../helpers/storage.js";
import { _isExpired, _createCacheKey } from "./utils.js";
import { _cleanupCache } from "./cleanup.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.offline-mode-manager.cache.manager";
async function _openCache() {
  if (getCache()) return getCache();
  const config = getConfig();
  if ("caches" in window) {
    try {
      const cache = await caches.open(config.cacheName);
      setCache(cache);
      return cache;
    } catch (e) {
      _log("warn", "Cache API not available:", e.message);
    }
  }
  return null;
}
async function _cacheResponse(url, response) {
  const cache = await _openCache();
  if (!cache) return false;
  try {
    const key = _createCacheKey(url);
    await cache.put(key, response.clone());
    updateCacheMetadata(key, {
      timestamp: Date.now(),
      size: response.headers.get("content-length") || 0,
      contentType: response.headers.get("content-type") || "unknown"
    });
    _saveCacheMetadata();
    await _cleanupCache();
    return true;
  } catch (e) {
    _log("warn", "Failed to cache response:", e.message);
    return false;
  }
}
async function _getCachedResponse(url) {
  const cache = await _openCache();
  if (!cache) return null;
  try {
    const key = _createCacheKey(url);
    const response = await cache.match(key);
    const metadata = getCacheMetadata();
    if (response) {
      if (!_isExpired(metadata[key])) {
        incrementMetric("cacheHits");
        return response;
      }
    }
    incrementMetric("cacheMisses");
    return null;
  } catch (e) {
    _log("warn", "Failed to get cached response:", e.message);
    return null;
  }
}
export {
  MODULE_ID,
  VERSION,
  _cacheResponse,
  _getCachedResponse,
  _openCache
};
