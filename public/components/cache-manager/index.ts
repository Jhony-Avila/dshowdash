

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.10.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cache-manager
// PURPOSE: Unified cache management with policies, lifecycle, telemetry
// ───────────────────────────────────────────────────────────────
// @contract CACHE_OPS - get/set/has/delete/clear/getOrSet/getOrSetAsync
// @contract LIFECYCLE - init/shutdown/destroy/reset
// @contract POLICIES - setPolicy/getPolicy/evict/evictBatch
// @contract TELEMETRY - event tracking via tracker.js
// @contract INTEGRATIONS - GlobalState and Orchestrator sync
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ORCHESTRATOR_EVENTS from /core/runtime/events/index.js
//   createCorePorts from /core/runtime/ports-profiles.js
//   cacheStore from ./state/store.js
//   CacheStorage from ./core/storage.js
//   CachePolicies from ./core/policies.js
//   CacheLifecycle from ./core/lifecycle.js
//   trackCacheEvent, getEventLog, etc from ./telemetry/tracker.js
//   generateKey, formatBytes, etc from ./utils/helpers.js
//   TTL, SIZE, POLICIES, CLEANUP, SWR, etc from ./core/contracts.js
// PROVIDES:
//   CacheManager.init(), shutdown(), destroy(), reset(),
//   get(), set(), has(), delete(), clear(), getOrSet(),
//   getOrSetAsync(), cleanExpired(), setPolicy(), getPolicy(),
//   evict(), getStats(), getSize(), status(),
//   healthCheck(), info(), getSnapshot(),
//   VERSION, MODULE_ID, injectPorts(), getPorts()
// @changelog v3.10.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.9.0-STRICT-WINDOW: Window globals só expostos quando !isStrict()
// @changelog v3.7.0-ENTERPRISE: ES6 modernization (const/let, arrow functions, template literals)
// @changelog v3.6.0-ENTERPRISE: Fixed duplicate export of injectPorts/getPorts
// ═══════════════════════════════════════════════════════════════
'use strict';

declare global { interface Window { CacheManager: any; } }
import { ORCHESTRATOR_EVENTS } from '/core/runtime/events/catalog/orchestrator.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { cacheStore } from './state/store.js';
import { CacheStorage } from './core/storage.js';
import { CachePolicies } from './core/policies.js';
import { CacheLifecycle } from './core/lifecycle.js';
import { trackCacheEvent, getEventLog, getRecentEvents, getTrackerStats, clearEventLog, healthCheck as trackerHealthCheck, info as trackerInfo } from './telemetry/tracker.js';
import { generateKey, formatBytes, calculateSize, sanitizeValue, hashKey } from './utils/helpers.js';
import { VERSION as CONTRACTS_VERSION, TTL, SIZE, POLICIES, CLEANUP, SWR, TELEMETRY_EVENTS, getTTLForEndpoint, shouldCache, info as contractsInfo } from './core/contracts.js';

export const VERSION = '3.10.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cache-manager';

const CACHE_EVENTS = { HIT: 'cache:hit', MISS: 'cache:miss' };

type LoggerPort = { error?: (...a: unknown[]) => void; warn?: (...a: unknown[]) => void; debug?: (...a: unknown[]) => void };
type GlobalStatePort = { subscribe?: (cb: (v: boolean) => void, key: string) => (() => void) | unknown };
type EventBusPort = { on?: (event: string, handler: () => void, opts?: Record<string, unknown>) => void; off?: (event: string, handler: () => void) => void; emit?: (event: string, data: Record<string, unknown>) => void };

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _debug = false;
const _log = (level: 'error' | 'warn' | 'info' | 'debug', msg: string, extra?: unknown) => {
  const logger = _getPort('logger') as LoggerPort | null;
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}] ${msg}`, extra); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}] ${msg}`, extra); return; }
  if (_debug) logger.debug?.(`[${MODULE_ID}] ${msg}`, extra);
};

let orchestratorCleanups: (() => void)[] = [];
let globalStateCleanups: (() => void)[] = [];
let destroyed = false;
let initTimestamp: number | null = null;
let _metrics: { apiCalls: number; backendHits: number; backendMisses: number; integrationErrors: number; lastApiCallAt: number | null } = { apiCalls: 0, backendHits: 0, backendMisses: 0, integrationErrors: 0, lastApiCallAt: null };

const setupGlobalStateIntegration = () => {
  const gs = _getPort('globalState') as GlobalStatePort | null;
  if (!gs) return false;
  try {
    const unsubscribeMaintenance = gs.subscribe?.((maintenanceMode: boolean) => {
      if (maintenanceMode) {
        const cleaned = CacheStorage.cleanExpired();
        trackCacheEvent(TELEMETRY_EVENTS.GLOBALSTATE_SYNC, { action: 'maintenance-cleanup', cleaned, moduleId: MODULE_ID });
      }
    }, 'app.maintenanceMode');
    if (typeof unsubscribeMaintenance === 'function') globalStateCleanups.push(unsubscribeMaintenance as () => void);
    trackCacheEvent(TELEMETRY_EVENTS.GLOBALSTATE_SYNC, { action: 'connected', moduleId: MODULE_ID });
    _log('info', 'GlobalState integration connected');
    return true;
  } catch (error: any) {
    _metrics.integrationErrors++;
    trackCacheEvent(`${TELEMETRY_EVENTS.GLOBALSTATE_SYNC}:error`, { error: error.message, moduleId: MODULE_ID });
    return false;
  }
};

const cleanupGlobalStateIntegration = () => {
  globalStateCleanups.forEach((cleanup) => { try { if (typeof cleanup === 'function') cleanup(); } catch(e) {} });
  globalStateCleanups = [];
};

const setupOrchestratorIntegration = () => {
  const eb = _getPort('eventBus') as EventBusPort | null;
  if (!eb) return false;
  try {
    const presetHandler = () => {
      const cleaned = CacheStorage.cleanExpired();
      trackCacheEvent(TELEMETRY_EVENTS.ORCHESTRATOR_SYNC, { action: 'cleanup-on-preset', cleaned, moduleId: MODULE_ID });
    };
    eb.on?.(ORCHESTRATOR_EVENTS.PRESET_APPLIED, presetHandler, { sourceModule: MODULE_ID });
    orchestratorCleanups.push(() => { try { eb.off?.(ORCHESTRATOR_EVENTS.PRESET_APPLIED, presetHandler); } catch(e) {} });
    // @ts-expect-error strict migration — TS2345
    const unsubscribe = cacheStore.subscribe((data: { action: string }) => {
      const { action } = data;
      const evb = _getPort('eventBus') as EventBusPort | null;
      if (!evb) return;
      try {
        if (action === 'cache-hit') evb.emit?.(CACHE_EVENTS.HIT, { timestamp: Date.now(), moduleId: MODULE_ID });
        else if (action === 'cache-miss') evb.emit?.(CACHE_EVENTS.MISS, { timestamp: Date.now(), moduleId: MODULE_ID });
      } catch(e) {}
    });
    orchestratorCleanups.push(unsubscribe);
    trackCacheEvent(TELEMETRY_EVENTS.ORCHESTRATOR_SYNC, { action: 'connected', moduleId: MODULE_ID });
    _log('info', 'Orchestrator integration connected');
    return true;
  } catch (error: any) {
    _metrics.integrationErrors++;
    trackCacheEvent(`${TELEMETRY_EVENTS.ORCHESTRATOR_SYNC}:error`, { error: error.message, moduleId: MODULE_ID });
    return false;
  }
};

const cleanupOrchestratorIntegration = () => {
  orchestratorCleanups.forEach((cleanup) => { try { if (typeof cleanup === 'function') cleanup(); } catch(e) {} });
  orchestratorCleanups = [];
};

const parseBackendCacheHeader = (response: { headers?: { get: (name: string) => string | null } } | null) => {
  if (!response?.headers) return null;
  try {
    const xCache = response.headers.get('X-Cache');
    if (!xCache) return null;
    const isHit = xCache.toUpperCase().indexOf('HIT') > -1;
    if (isHit) {
      _metrics.backendHits++;
      trackCacheEvent(TELEMETRY_EVENTS.BACKEND_HIT, { header: xCache, moduleId: MODULE_ID });
    } else {
      _metrics.backendMisses++;
      trackCacheEvent(TELEMETRY_EVENTS.BACKEND_MISS, { header: xCache, moduleId: MODULE_ID });
    }
    return { hit: isHit, header: xCache };
  } catch(e) { return null; }
};

const CacheManager = {
  version: VERSION, name: MODULE_ID, moduleId: MODULE_ID,
  TTL, SIZE, POLICIES, CLEANUP, SWR, EVENTS: TELEMETRY_EVENTS, CACHE_EVENTS,
  setDebug: (debug: boolean) => { _debug = debug; CacheLifecycle.setDebug?.(debug); CacheStorage.setDebug?.(debug); CachePolicies.setDebug?.(debug); },
  getVersion: () => VERSION,
  isInitialized: () => CacheLifecycle.isInitialized() && !destroyed,
  injectPorts, getPorts,
  init: (options: { debug?: boolean } & Record<string, unknown> = {}) => {
    if (destroyed) destroyed = false;
    _initPorts();
    trackCacheEvent(`${TELEMETRY_EVENTS.INIT}:called`, { moduleId: MODULE_ID });
    if (options.debug) CacheManager.setDebug(true);
    return CacheLifecycle.init(options).then((result) => {
      if (result) {
        setupGlobalStateIntegration();
        setupOrchestratorIntegration();
        initTimestamp = Date.now();
        _log('info', 'CacheManager initialized');
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
    _log('info', 'CacheManager shutdown');
    return result;
  },
  destroy: () => CacheManager.shutdown(),
  reset: () => {
    _log('info', 'reset() called');
    trackCacheEvent(`${TELEMETRY_EVENTS.RESET}:called`, { moduleId: MODULE_ID });
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    CacheLifecycle.reset();
    CacheManager.resetMetrics();
    destroyed = false;
    _log('info', 'Reset complete');
    return true;
  },
  get: (key: string) => { _metrics.apiCalls++; _metrics.lastApiCallAt = Date.now(); return CacheStorage.get(key); },
  set: (key: string, value: unknown, ttl: number | null) => { _metrics.apiCalls++; _metrics.lastApiCallAt = Date.now(); return CacheStorage.set(key, value, ttl); },
  has: (key: string) => CacheStorage.has(key),
  delete: (key: string) => { _metrics.apiCalls++; return CacheStorage.delete(key); },
  clear: () => { _metrics.apiCalls++; return CacheStorage.clear(); },
  getOrSet: (key: string, factory: (() => unknown) | unknown, ttl: number | null) => { _metrics.apiCalls++; _metrics.lastApiCallAt = Date.now(); return CacheStorage.getOrSet(key, factory, ttl); },
  getOrSetAsync: (key: string, factory: () => Promise<unknown>, ttl: number | null, options: { revalidate?: boolean } & Record<string, unknown>) => { _metrics.apiCalls++; _metrics.lastApiCallAt = Date.now(); return CacheStorage.getOrSetAsync(key, factory, ttl, options); },
  cleanExpired: () => CacheStorage.cleanExpired(),
  setPolicy: (policy: string) => CachePolicies.setPolicy(policy),
  getPolicy: () => CachePolicies.getPolicy(),
  evict: () => CachePolicies.evict(),
  evictBatch: (count: number) => CachePolicies.evictBatch(count),
  getEvictionCandidates: (count: number) => CachePolicies.getEvictionCandidates(count),
  getStats: () => cacheStore.getStats(),
  getSize: () => cacheStore.getSize(),
  status: () => CacheLifecycle.getStatus(),
  healthCheck: () => {
    const portsSnapshot = Ports.snapshot();
    const lifecycleHealth: Record<string, unknown> = CacheLifecycle.healthCheck?.() || {};
    const storageHealth: Record<string, unknown> = CacheStorage.healthCheck?.() || {};
    const policiesHealth: Record<string, unknown> = CachePolicies.healthCheck?.() || {};
    const trackerHealth: Record<string, unknown> = trackerHealthCheck?.() || {};
    const stats = cacheStore.getStats();
    const checks = {
      initialized: CacheLifecycle.isInitialized(),
      notDestroyed: !destroyed,
      lifecycleHealthy: lifecycleHealth.status === 'HEALTHY',
      storageHealthy: storageHealth.status === 'HEALTHY',
      policiesHealthy: policiesHealth.status === 'HEALTHY',
      trackerHealthy: trackerHealth.status === 'HEALTHY',
      notAtCapacity: stats.size < stats.maxSize,
      healthyHitRate: stats.hitRate >= 0.1 || (stats.hits + stats.misses) < 100,
      globalStateConnected: globalStateCleanups.length > 0,
      orchestratorConnected: orchestratorCleanups.length > 0,
      portsInitialized: portsSnapshot._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const issues = [];
    if (!checks.initialized) issues.push('Not initialized');
    if (!checks.notDestroyed) issues.push('Manager is destroyed');
    if (!checks.lifecycleHealthy) issues.push('Lifecycle unhealthy');
    if (!checks.storageHealthy) issues.push('Storage unhealthy');
    if (!checks.notAtCapacity) issues.push('At max capacity');
    if (!checks.healthyHitRate) issues.push('Low hit rate (<10%)');
    if (!checks.globalStateConnected) issues.push('GlobalState not connected');
    if (!checks.orchestratorConnected) issues.push('Orchestrator not connected');
    const status = passed >= 8 ? 'HEALTHY' : (passed >= 5 ? 'DEGRADED' : 'UNHEALTHY');
    return { status, score: `${passed}/${total}`, healthy: passed >= 8, checks, issues: issues.length > 0 ? issues : null, portsInitialized: portsSnapshot._initialized, version: VERSION, moduleId: MODULE_ID, strictMode: isStrict(), timestamp: Date.now() };
  },
  info: () => {
    const portsSnapshot = Ports.snapshot();
    const stats = cacheStore.getStats();
    const trackerStats = getTrackerStats();
    const policyStats = CachePolicies.getEvictionStats();
    const storageStats: Record<string, unknown> = CacheStorage.getStats?.() || {};
    const hitRate = (stats.hits + stats.misses) > 0 ? `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)}%` : '0%';
    return {
      name: MODULE_ID, version: VERSION, contractsVersion: CONTRACTS_VERSION,
      portsInitialized: portsSnapshot._initialized, debug: _debug,
      status: CacheLifecycle.getStatus(), healthCheck: CacheManager.healthCheck(),
      policy: CachePolicies.getPolicy(),
      stats: { size: stats.size, maxSize: stats.maxSize, hits: stats.hits, misses: stats.misses, hitRate, evictions: stats.evictions, cleanedExpired: stats.cleanedExpired || 0 },
      swr: { enabled: SWR.ENABLED, gracePeriod: SWR.GRACE_PERIOD, staleServed: (storageStats.metrics as Record<string, unknown>)?.staleServed || 0 },
      backend: { hits: _metrics.backendHits, misses: _metrics.backendMisses },
      evictionStats: policyStats, telemetry: trackerStats,
      integrations: { orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0 },
      metrics: { ..._metrics }, uptime: initTimestamp ? Date.now() - initTimestamp : 0, timestamp: Date.now()
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
  subscribe: (listener: (...args: unknown[]) => void) => cacheStore.subscribe(listener),
  parseBackendCacheHeader,
  getTTLForEndpoint,
  shouldCache,
  resetMetrics: () => {
    _metrics = { apiCalls: 0, backendHits: 0, backendMisses: 0, integrationErrors: 0, lastApiCallAt: null as number | null };
    CacheStorage.resetMetrics?.();
    CachePolicies.resetEvictionStats?.();
  },
  utils: { formatBytes, calculateSize, generateKey, sanitizeValue, hashKey },
  debug: {
    getEventLog, getRecentEvents, clearEventLog,
    getStore: () => cacheStore.toJSON(),
    getEvictionStats: () => CachePolicies.getEvictionStats(),
    getEvictionCandidates: (n: number) => CachePolicies.getEvictionCandidates(n),
    getStorageStats: () => CacheStorage.getStats(),
    getContracts: () => contractsInfo(),
    getTelemetryInfo: () => trackerInfo()
  }
};

if (typeof window !== 'undefined') {
  // Strict mode: só expor globals quando não estiver em strict mode
  if (!isStrict()) {
    window.CacheManager = CacheManager;
    trackCacheEvent('cache:global:exposed', { moduleId: MODULE_ID });
  }

  // DevTools sempre permitido (não é acesso de produção)
  window.__dev = window.__dev || {};
  window.__dev.cacheManager = {
    getVersion: () => VERSION,
    healthCheck: () => CacheManager.healthCheck(),
    info: () => CacheManager.info(),
    isInitialized: () => CacheManager.isInitialized(),
    reset: () => CacheManager.reset(),
    getStats: () => cacheStore.getStats(),
    getSnapshot: (limit: number) => CacheManager.getSnapshot(limit),
    store: cacheStore, storage: CacheStorage, policies: CachePolicies, lifecycle: CacheLifecycle,
    contracts: { TTL, SIZE, POLICIES, CLEANUP, SWR }
  };
}

export function healthCheck() {
  return CacheManager.healthCheck();
}

export function info() {
  return CacheManager.info();
}

export default CacheManager;
export { CacheManager, CACHE_EVENTS, cacheStore, CacheStorage, CachePolicies, CacheLifecycle, TTL, SIZE, POLICIES, CLEANUP, SWR, TELEMETRY_EVENTS };
