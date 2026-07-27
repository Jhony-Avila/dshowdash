import { VERSION, MODULE_ID, OFFLINE_STATES, CACHE_STRATEGIES, DEFAULT_CONFIG } from "./constants.js";
import {
  _instance,
  setInstance,
  getConfig,
  setConfig,
  getState,
  setState,
  isInitialized,
  setIsInitialized,
  setCache,
  getSyncTimer,
  setSyncTimer,
  getOfflineQueue,
  setOfflineQueue,
  getCacheMetadata,
  setCacheMetadata,
  _listeners,
  getMetrics
} from "./state.js";
import { _log, _emit, _loadState, _loadCacheMetadata, _saveCacheMetadata } from "./helpers/index.js";
import { _openCache, _cacheResponse, _getCachedResponse } from "./cache/index.js";
import { _updateOfflineIndicator } from "./ui/index.js";
import { cachedFetch, _processOfflineQueue, queueRequest } from "./network/index.js";
function _updateOnlineStatus() {
  const wasOffline = getState() === OFFLINE_STATES.OFFLINE;
  setState(navigator.onLine ? OFFLINE_STATES.ONLINE : OFFLINE_STATES.OFFLINE);
  if (wasOffline && getState() === OFFLINE_STATES.ONLINE) {
    _log("info", "Back online, processing queue...");
    _emit("online", {});
    _processOfflineQueue();
  } else if (!wasOffline && getState() === OFFLINE_STATES.OFFLINE) {
    _log("info", "Gone offline");
    _emit("offline", {});
  }
  _updateOfflineIndicator();
}
function createOfflineModeManager(options = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  setCacheMetadata(_loadCacheMetadata());
  const savedState = _loadState();
  if (savedState) {
    setOfflineQueue(savedState.offlineQueue || []);
  }
  _log("debug", "Offline Mode Manager created", { strategy: getConfig().strategy });
  return {
    init,
    destroy,
    getState,
    isOnline: () => getState() === OFFLINE_STATES.ONLINE,
    isOffline: () => getState() === OFFLINE_STATES.OFFLINE,
    isSyncing: () => getState() === OFFLINE_STATES.SYNCING,
    fetch: cachedFetch,
    cacheUrl,
    getCached,
    clearCache,
    getCacheSize,
    queueRequest,
    getQueueSize: () => getOfflineQueue().length,
    processQueue: _processOfflineQueue,
    setStrategy,
    getStrategy: () => getConfig().strategy,
    subscribe,
    healthCheck,
    info
  };
}
function getOfflineModeManager(options = {}) {
  if (!_instance) {
    setInstance(createOfflineModeManager(options));
  }
  return _instance;
}
async function init() {
  if (isInitialized()) return true;
  await _openCache();
  window.addEventListener("online", _updateOnlineStatus);
  window.addEventListener("offline", _updateOnlineStatus);
  _updateOnlineStatus();
  const config = getConfig();
  if (config.autoSync && config.syncInterval > 0) {
    setSyncTimer(setInterval(() => {
      if (getState() === OFFLINE_STATES.ONLINE && getOfflineQueue().length > 0) {
        _processOfflineQueue();
      }
    }, config.syncInterval));
  }
  setIsInitialized(true);
  _emit("initialized", { state: getState() });
  _log("info", "Initialized, status:", getState());
  return true;
}
function destroy() {
  if (!isInitialized()) return true;
  window.removeEventListener("online", _updateOnlineStatus);
  window.removeEventListener("offline", _updateOnlineStatus);
  const timer = getSyncTimer();
  if (timer) {
    clearInterval(timer);
    setSyncTimer(null);
  }
  const indicator = document.getElementById("dsd-offline-indicator");
  if (indicator) indicator.remove();
  setIsInitialized(false);
  _log("info", "Destroyed");
  return true;
}
async function cacheUrl(url) {
  if (getState() === OFFLINE_STATES.OFFLINE) return false;
  try {
    const response = await fetch(url);
    if (response.ok) {
      await _cacheResponse(url, response);
      return true;
    }
    return false;
  } catch (e) {
    _log("warn", "Failed to cache URL:", url, e.message);
    return false;
  }
}
async function getCached(url) {
  return _getCachedResponse(url);
}
async function clearCache() {
  const config = getConfig();
  try {
    if ("caches" in window) {
      await caches.delete(config.cacheName);
    }
    setCacheMetadata({});
    _saveCacheMetadata();
    setCache(null);
    _emit("cacheCleared", {});
    _log("info", "Cache cleared");
    return true;
  } catch (e) {
    _log("error", "Failed to clear cache:", e.message);
    return false;
  }
}
function getCacheSize() {
  const metadata = getCacheMetadata();
  const entries = Object.keys(metadata).length;
  const totalSize = Object.values(metadata).reduce((sum, meta) => sum + (parseInt(meta.size) || 0), 0);
  return {
    entries,
    bytes: totalSize,
    formatted: totalSize > 1024 * 1024 ? `${(totalSize / (1024 * 1024)).toFixed(2)} MB` : `${(totalSize / 1024).toFixed(2)} KB`
  };
}
function setStrategy(strategy) {
  if (!Object.values(CACHE_STRATEGIES).includes(strategy)) {
    _log("error", "Invalid strategy:", strategy);
    return false;
  }
  const config = getConfig();
  config.strategy = strategy;
  setConfig(config);
  _emit("strategyChanged", { strategy });
  return true;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
  const cacheAvailable = "caches" in window;
  const metrics = getMetrics();
  const checks = {
    initialized: isInitialized(),
    cacheApiAvailable: cacheAvailable,
    isOnline: getState() !== OFFLINE_STATES.OFFLINE,
    queueEmpty: getOfflineQueue().length === 0,
    noErrors: metrics.errors === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    state: getState(),
    cacheSize: getCacheSize(),
    queueSize: getOfflineQueue().length,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.values(OFFLINE_STATES),
    strategies: Object.values(CACHE_STRATEGIES),
    config: {
      strategy: config.strategy,
      cacheName: config.cacheName,
      maxAge: config.maxAge,
      maxItems: config.maxItems,
      autoSync: config.autoSync
    },
    currentState: getState(),
    isInitialized: isInitialized(),
    cacheSize: getCacheSize(),
    queueSize: getOfflineQueue().length
  };
}
export {
  cacheUrl,
  cachedFetch,
  clearCache,
  createOfflineModeManager,
  destroy,
  getCacheSize,
  getCached,
  getOfflineModeManager,
  healthCheck,
  info,
  init,
  queueRequest,
  setStrategy,
  subscribe
};
