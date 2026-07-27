import { ORCHESTRATOR_EVENTS } from "/core/runtime/events/catalog/orchestrator.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { cacheStore } from "./state/store.js";
import { CacheStorage } from "./core/storage.js";
import { CachePolicies } from "./core/policies.js";
import { CacheLifecycle } from "./core/lifecycle.js";
import { trackCacheEvent, getEventLog, getRecentEvents, getTrackerStats, clearEventLog, healthCheck as trackerHealthCheck, info as trackerInfo } from "./telemetry/tracker.js";
import { generateKey, formatBytes, calculateSize, sanitizeValue, hashKey } from "./utils/helpers.js";
import { VERSION as CONTRACTS_VERSION, TTL, SIZE, POLICIES, CLEANUP, SWR, TELEMETRY_EVENTS, getTTLForEndpoint, shouldCache, info as contractsInfo } from "./core/contracts.js";
const VERSION = "3.10.0-P2-ENTERPRISE";
const MODULE_ID = "components.cache-manager";
const CACHE_EVENTS = { HIT: "cache:hit", MISS: "cache:miss" };
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let _debug = false;
const _log = (level, msg, extra) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}] ${msg}`, extra);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}] ${msg}`, extra);
    return;
  }
  if (_debug) logger.debug?.(`[${MODULE_ID}] ${msg}`, extra);
};
let orchestratorCleanups = [];
let globalStateCleanups = [];
let destroyed = false;
let initTimestamp = null;
let _metrics = { apiCalls: 0, backendHits: 0, backendMisses: 0, integrationErrors: 0, lastApiCallAt: null };
const setupGlobalStateIntegration = () => {
  const gs = _getPort("globalState");
  if (!gs) return false;
  try {
    const unsubscribeMaintenance = gs.subscribe?.((maintenanceMode) => {
      if (maintenanceMode) {
        const cleaned = CacheStorage.cleanExpired();
        trackCacheEvent(TELEMETRY_EVENTS.GLOBALSTATE_SYNC, { action: "maintenance-cleanup", cleaned, moduleId: MODULE_ID });
      }
    }, "app.maintenanceMode");
    if (typeof unsubscribeMaintenance === "function") globalStateCleanups.push(unsubscribeMaintenance);
    trackCacheEvent(TELEMETRY_EVENTS.GLOBALSTATE_SYNC, { action: "connected", moduleId: MODULE_ID });
    _log("info", "GlobalState integration connected");
    return true;
  } catch (error) {
    _metrics.integrationErrors++;
    trackCacheEvent(`${TELEMETRY_EVENTS.GLOBALSTATE_SYNC}:error`, { error: error.message, moduleId: MODULE_ID });
    return false;
  }
};
const cleanupGlobalStateIntegration = () => {
  globalStateCleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  });
  globalStateCleanups = [];
};
const setupOrchestratorIntegration = () => {
  const eb = _getPort("eventBus");
  if (!eb) return false;
  try {
    const presetHandler = () => {
      const cleaned = CacheStorage.cleanExpired();
      trackCacheEvent(TELEMETRY_EVENTS.ORCHESTRATOR_SYNC, { action: "cleanup-on-preset", cleaned, moduleId: MODULE_ID });
    };
    eb.on?.(ORCHESTRATOR_EVENTS.PRESET_APPLIED, presetHandler, { sourceModule: MODULE_ID });
    orchestratorCleanups.push(() => {
      try {
        eb.off?.(ORCHESTRATOR_EVENTS.PRESET_APPLIED, presetHandler);
      } catch (e) {
      }
    });
    const unsubscribe = cacheStore.subscribe((data) => {
      const { action } = data;
      const evb = _getPort("eventBus");
      if (!evb) return;
      try {
        if (action === "cache-hit") evb.emit?.(CACHE_EVENTS.HIT, { timestamp: Date.now(), moduleId: MODULE_ID });
        else if (action === "cache-miss") evb.emit?.(CACHE_EVENTS.MISS, { timestamp: Date.now(), moduleId: MODULE_ID });
      } catch (e) {
      }
    });
    orchestratorCleanups.push(unsubscribe);
    trackCacheEvent(TELEMETRY_EVENTS.ORCHESTRATOR_SYNC, { action: "connected", moduleId: MODULE_ID });
    _log("info", "Orchestrator integration connected");
    return true;
  } catch (error) {
    _metrics.integrationErrors++;
    trackCacheEvent(`${TELEMETRY_EVENTS.ORCHESTRATOR_SYNC}:error`, { error: error.message, moduleId: MODULE_ID });
    return false;
  }
};
const cleanupOrchestratorIntegration = () => {
  orchestratorCleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  });
  orchestratorCleanups = [];
};
const parseBackendCacheHeader = (response) => {
  if (!response?.headers) return null;
  try {
    const xCache = response.headers.get("X-Cache");
    if (!xCache) return null;
    const isHit = xCache.toUpperCase().indexOf("HIT") > -1;
    if (isHit) {
      _metrics.backendHits++;
      trackCacheEvent(TELEMETRY_EVENTS.BACKEND_HIT, { header: xCache, moduleId: MODULE_ID });
    } else {
      _metrics.backendMisses++;
      trackCacheEvent(TELEMETRY_EVENTS.BACKEND_MISS, { header: xCache, moduleId: MODULE_ID });
    }
    return { hit: isHit, header: xCache };
  } catch (e) {
    return null;
  }
};
const CacheManager = {
  version: VERSION,
  name: MODULE_ID,
  moduleId: MODULE_ID,
  TTL,
  SIZE,
  POLICIES,
  CLEANUP,
  SWR,
  EVENTS: TELEMETRY_EVENTS,
  CACHE_EVENTS,
  setDebug: (debug) => {
    _debug = debug;
    CacheLifecycle.setDebug?.(debug);
    CacheStorage.setDebug?.(debug);
    CachePolicies.setDebug?.(debug);
  },
  getVersion: () => VERSION,
  isInitialized: () => CacheLifecycle.isInitialized() && !destroyed,
  injectPorts,
  getPorts,
  init: (options = {}) => {
    if (destroyed) destroyed = false;
    _initPorts();
    trackCacheEvent(`${TELEMETRY_EVENTS.INIT}:called`, { moduleId: MODULE_ID });
    if (options.debug) CacheManager.setDebug(true);
    return CacheLifecycle.init(options).then((result) => {
      if (result) {
        setupGlobalStateIntegration();
        setupOrchestratorIntegration();
        initTimestamp = Date.now();
        _log("info", "CacheManager initialized");
      }
      return result;
    });
  },
  shutdown: () => {
    trackCacheEvent(`${TELEMETRY_EVENTS.SHUTDOWN}:called`, { moduleId: MODULE_ID });
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    const result = CacheLifecycle.shutdown();
    destroyed = true;
    initTimestamp = null;
    _log("info", "CacheManager shutdown");
    return result;
  },
  destroy: () => CacheManager.shutdown(),
  reset: () => {
    _log("info", "reset() called");
    trackCacheEvent(`${TELEMETRY_EVENTS.RESET}:called`, { moduleId: MODULE_ID });
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    CacheLifecycle.reset();
    CacheManager.resetMetrics();
    destroyed = false;
    _log("info", "Reset complete");
    return true;
  },
  get: (key) => {
    _metrics.apiCalls++;
    _metrics.lastApiCallAt = Date.now();
    return CacheStorage.get(key);
  },
  set: (key, value, ttl) => {
    _metrics.apiCalls++;
    _metrics.lastApiCallAt = Date.now();
    return CacheStorage.set(key, value, ttl);
  },
  has: (key) => CacheStorage.has(key),
  delete: (key) => {
    _metrics.apiCalls++;
    return CacheStorage.delete(key);
  },
  clear: () => {
    _metrics.apiCalls++;
    return CacheStorage.clear();
  },
  getOrSet: (key, factory, ttl) => {
    _metrics.apiCalls++;
    _metrics.lastApiCallAt = Date.now();
    return CacheStorage.getOrSet(key, factory, ttl);
  },
  getOrSetAsync: (key, factory, ttl, options) => {
    _metrics.apiCalls++;
    _metrics.lastApiCallAt = Date.now();
    return CacheStorage.getOrSetAsync(key, factory, ttl, options);
  },
  cleanExpired: () => CacheStorage.cleanExpired(),
  setPolicy: (policy) => CachePolicies.setPolicy(policy),
  getPolicy: () => CachePolicies.getPolicy(),
  evict: () => CachePolicies.evict(),
  evictBatch: (count) => CachePolicies.evictBatch(count),
  getEvictionCandidates: (count) => CachePolicies.getEvictionCandidates(count),
  getStats: () => cacheStore.getStats(),
  getSize: () => cacheStore.getSize(),
  status: () => CacheLifecycle.getStatus(),
  healthCheck: () => {
    const portsSnapshot = Ports.snapshot();
    const lifecycleHealth = CacheLifecycle.healthCheck?.() || {};
    const storageHealth = CacheStorage.healthCheck?.() || {};
    const policiesHealth = CachePolicies.healthCheck?.() || {};
    const trackerHealth = trackerHealthCheck?.() || {};
    const stats = cacheStore.getStats();
    const checks = {
      initialized: CacheLifecycle.isInitialized(),
      notDestroyed: !destroyed,
      lifecycleHealthy: lifecycleHealth.status === "HEALTHY",
      storageHealthy: storageHealth.status === "HEALTHY",
      policiesHealthy: policiesHealth.status === "HEALTHY",
      trackerHealthy: trackerHealth.status === "HEALTHY",
      notAtCapacity: stats.size < stats.maxSize,
      healthyHitRate: stats.hitRate >= 0.1 || stats.hits + stats.misses < 100,
      globalStateConnected: globalStateCleanups.length > 0,
      orchestratorConnected: orchestratorCleanups.length > 0,
      portsInitialized: portsSnapshot._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const issues = [];
    if (!checks.initialized) issues.push("Not initialized");
    if (!checks.notDestroyed) issues.push("Manager is destroyed");
    if (!checks.lifecycleHealthy) issues.push("Lifecycle unhealthy");
    if (!checks.storageHealthy) issues.push("Storage unhealthy");
    if (!checks.notAtCapacity) issues.push("At max capacity");
    if (!checks.healthyHitRate) issues.push("Low hit rate (<10%)");
    if (!checks.globalStateConnected) issues.push("GlobalState not connected");
    if (!checks.orchestratorConnected) issues.push("Orchestrator not connected");
    const status = passed >= 8 ? "HEALTHY" : passed >= 5 ? "DEGRADED" : "UNHEALTHY";
    return { status, score: `${passed}/${total}`, healthy: passed >= 8, checks, issues: issues.length > 0 ? issues : null, portsInitialized: portsSnapshot._initialized, version: VERSION, moduleId: MODULE_ID, strictMode: isStrict(), timestamp: Date.now() };
  },
  info: () => {
    const portsSnapshot = Ports.snapshot();
    const stats = cacheStore.getStats();
    const trackerStats = getTrackerStats();
    const policyStats = CachePolicies.getEvictionStats();
    const storageStats = CacheStorage.getStats?.() || {};
    const hitRate = stats.hits + stats.misses > 0 ? `${(stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)}%` : "0%";
    return {
      name: MODULE_ID,
      version: VERSION,
      contractsVersion: CONTRACTS_VERSION,
      portsInitialized: portsSnapshot._initialized,
      debug: _debug,
      status: CacheLifecycle.getStatus(),
      healthCheck: CacheManager.healthCheck(),
      policy: CachePolicies.getPolicy(),
      stats: { size: stats.size, maxSize: stats.maxSize, hits: stats.hits, misses: stats.misses, hitRate, evictions: stats.evictions, cleanedExpired: stats.cleanedExpired || 0 },
      swr: { enabled: SWR.ENABLED, gracePeriod: SWR.GRACE_PERIOD, staleServed: storageStats.metrics?.staleServed || 0 },
      backend: { hits: _metrics.backendHits, misses: _metrics.backendMisses },
      evictionStats: policyStats,
      telemetry: trackerStats,
      integrations: { orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0 },
      metrics: { ..._metrics },
      uptime: initTimestamp ? Date.now() - initTimestamp : 0,
      timestamp: Date.now()
    };
  },
  getSnapshot: (limit = 20) => {
    const keys = cacheStore.getAllKeys().slice(0, limit);
    return keys.map((key) => {
      const entry = cacheStore.getEntry(key);
      if (!entry) return null;
      return { key, createdAt: entry.createdAt, lastAccess: entry.lastAccess, expiresAt: entry.expiresAt, expiresIn: Math.max(0, entry.expiresAt - Date.now()), accessCount: entry.accessCount, isStale: Date.now() > entry.expiresAt };
    }).filter(Boolean);
  },
  generateKey,
  subscribe: (listener) => cacheStore.subscribe(listener),
  parseBackendCacheHeader,
  getTTLForEndpoint,
  shouldCache,
  resetMetrics: () => {
    _metrics = { apiCalls: 0, backendHits: 0, backendMisses: 0, integrationErrors: 0, lastApiCallAt: null };
    CacheStorage.resetMetrics?.();
    CachePolicies.resetEvictionStats?.();
  },
  utils: { formatBytes, calculateSize, generateKey, sanitizeValue, hashKey },
  debug: {
    getEventLog,
    getRecentEvents,
    clearEventLog,
    getStore: () => cacheStore.toJSON(),
    getEvictionStats: () => CachePolicies.getEvictionStats(),
    getEvictionCandidates: (n) => CachePolicies.getEvictionCandidates(n),
    getStorageStats: () => CacheStorage.getStats(),
    getContracts: () => contractsInfo(),
    getTelemetryInfo: () => trackerInfo()
  }
};
if (typeof window !== "undefined") {
  if (!isStrict()) {
    window.CacheManager = CacheManager;
    trackCacheEvent("cache:global:exposed", { moduleId: MODULE_ID });
  }
  window.__dev = window.__dev || {};
  window.__dev.cacheManager = {
    getVersion: () => VERSION,
    healthCheck: () => CacheManager.healthCheck(),
    info: () => CacheManager.info(),
    isInitialized: () => CacheManager.isInitialized(),
    reset: () => CacheManager.reset(),
    getStats: () => cacheStore.getStats(),
    getSnapshot: (limit) => CacheManager.getSnapshot(limit),
    store: cacheStore,
    storage: CacheStorage,
    policies: CachePolicies,
    lifecycle: CacheLifecycle,
    contracts: { TTL, SIZE, POLICIES, CLEANUP, SWR }
  };
}
function healthCheck() {
  return CacheManager.healthCheck();
}
function info() {
  return CacheManager.info();
}
var cache_manager_default = CacheManager;
export {
  CACHE_EVENTS,
  CLEANUP,
  CacheLifecycle,
  CacheManager,
  CachePolicies,
  CacheStorage,
  MODULE_ID,
  POLICIES,
  SIZE,
  SWR,
  TELEMETRY_EVENTS,
  TTL,
  VERSION,
  cacheStore,
  cache_manager_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
