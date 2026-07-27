const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.dom-regions.cache";
const cacheConfig = {
  ttlMs: 3e4,
  maxSize: 50,
  autoCleanup: true,
  cleanupIntervalMs: 6e4
};
const regionCache = /* @__PURE__ */ new Map();
const cleanupInterval = { value: null };
const cacheHits = { hits: 0, misses: 0, expired: 0, evictions: 0 };
function getCacheEntry(name) {
  const entry = regionCache.get(name);
  if (!entry) return null;
  const now = Date.now();
  if (now - entry.cachedAt > cacheConfig.ttlMs) {
    regionCache.delete(name);
    cacheHits.expired++;
    return null;
  }
  if (entry.element && !document.contains(entry.element)) {
    regionCache.delete(name);
    cacheHits.evictions++;
    return null;
  }
  entry.lastAccess = now;
  entry.accessCount++;
  return entry;
}
function setCacheEntry(name, element) {
  const now = Date.now();
  if (regionCache.size >= cacheConfig.maxSize) {
    let oldest = null;
    let oldestTime = Infinity;
    regionCache.forEach((entry, key) => {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldest = key;
      }
    });
    if (oldest) {
      regionCache.delete(oldest);
      cacheHits.evictions++;
    }
  }
  regionCache.set(name, {
    element,
    cachedAt: now,
    lastAccess: now,
    accessCount: 1
  });
}
function cleanupExpiredEntries() {
  const now = Date.now();
  const expired = [];
  regionCache.forEach((entry, key) => {
    if (now - entry.cachedAt > cacheConfig.ttlMs) {
      expired.push(key);
    } else if (entry.element && !document.contains(entry.element)) {
      expired.push(key);
    }
  });
  for (let i = 0; i < expired.length; i++) {
    regionCache.delete(expired[i]);
    cacheHits.expired++;
  }
  return expired.length;
}
function startAutoCleanup() {
  if (cleanupInterval.value) return;
  if (!cacheConfig.autoCleanup) return;
  cleanupInterval.value = setInterval(cleanupExpiredEntries, cacheConfig.cleanupIntervalMs);
}
function stopAutoCleanup() {
  if (cleanupInterval.value) {
    clearInterval(cleanupInterval.value);
    cleanupInterval.value = null;
  }
}
if (typeof document !== "undefined") {
  startAutoCleanup();
}
export {
  MODULE_ID,
  VERSION,
  cacheConfig,
  cacheHits,
  cleanupExpiredEntries,
  cleanupInterval,
  getCacheEntry,
  regionCache,
  setCacheEntry,
  startAutoCleanup,
  stopAutoCleanup
};
