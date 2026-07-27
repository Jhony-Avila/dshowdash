// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cache-manager.core.lifecycle
// PURPOSE: Cache lifecycle management (init, shutdown, reset)
// ───────────────────────────────────────────────────────────────
// @contract LIFECYCLE - init/shutdown/reset operations
// @contract CLEANUP_SCHEDULING - Automatic cleanup interval management
// @contract PORTS - Integration via PortsFactory/PortsProfiles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   cacheStore from ../state/store.js
//   CacheStorage from ./storage.js
//   CachePolicies from ./policies.js
//   trackCacheEvent from ../telemetry/tracker.js
//   CLEANUP, TELEMETRY_EVENTS, validateTTL, validateSize from ./contracts.js
// PROVIDES: CacheLifecycle.init(), shutdown(), reset(), isInitialized(),
//   getStatus(), healthCheck(), info(), injectPorts(), getPorts()
// @changelog v3.4.1-STRICT-MODE: Strict mode integration in healthCheck/info
// @changelog v3.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.3.0-ENTERPRISE: ES6 modernization
// @changelog v3.2.1-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { cacheStore } from '../state/store.js';
import { CacheStorage } from './storage.js';
import { CachePolicies } from './policies.js';
import { trackCacheEvent } from '../telemetry/tracker.js';
import { CLEANUP, TELEMETRY_EVENTS, validateTTL, validateSize } from './contracts.js';

export const VERSION = '3.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cache-manager.core.lifecycle';

type LoggerPort = { error?: (...a: unknown[]) => void; warn?: (...a: unknown[]) => void; debug?: (...a: unknown[]) => void };

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _debug = false;
let initialized = false;
let destroyed = false;
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
let cleanupIntervalMs: number | null = null;
let _metrics: { initCount: number; resetCount: number; shutdownCount: number; cleanupScheduled: number; lastInitAt: number | null; lastResetAt: number | null; lastShutdownAt: number | null } = { initCount: 0, resetCount: 0, shutdownCount: 0, cleanupScheduled: 0, lastInitAt: null, lastResetAt: null, lastShutdownAt: null };

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger') as LoggerPort | null;
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; }
  if (_debug) logger.debug?.(`[${MODULE_ID}]`, ...args);
};

const CacheLifecycle = {
  setDebug: (debug: boolean) => { _debug = debug; CacheStorage.setDebug?.(debug); CachePolicies.setDebug?.(debug); },
  getVersion: () => VERSION,
  init: (options: Record<string, unknown> = {}) => {
    if (initialized) {
      trackCacheEvent(`${TELEMETRY_EVENTS.INIT}:skipped`, { reason: 'already-initialized', moduleId: MODULE_ID });
      return Promise.resolve(false);
    }
    _initPorts();
    trackCacheEvent(`${TELEMETRY_EVENTS.INIT}:start`, { moduleId: MODULE_ID });
    const maxSize = validateSize(options.maxSize);
    const defaultTTL = validateTTL(options.defaultTTL);
    cacheStore.set('maxSize', maxSize);
    cacheStore.set('defaultTTL', defaultTTL);
    if (options.policy) CachePolicies.setPolicy(options.policy as string);
    if (typeof options.cleanupInterval === 'number') {
      const interval = Math.max(CLEANUP.MIN_INTERVAL, Math.min(options.cleanupInterval, CLEANUP.MAX_INTERVAL));
      cleanupIntervalMs = interval;
      cleanupInterval = setInterval(() => CacheStorage.cleanExpired(), cleanupIntervalMs);
      _metrics.cleanupScheduled++;
      _log('info', 'Cleanup scheduled every', cleanupIntervalMs, 'ms');
    }
    if (options.debug) CacheLifecycle.setDebug(true);
    initialized = true;
    destroyed = false;
    _metrics.initCount++;
    _metrics.lastInitAt = Date.now();
    trackCacheEvent(`${TELEMETRY_EVENTS.INIT}:complete`, { maxSize, defaultTTL, cleanupInterval: cleanupIntervalMs, policy: CachePolicies.getPolicy(), initCount: _metrics.initCount, moduleId: MODULE_ID });
    _log('info', 'Lifecycle initialized');
    return Promise.resolve(true);
  },
  shutdown: () => {
    trackCacheEvent(`${TELEMETRY_EVENTS.SHUTDOWN}:start`, { moduleId: MODULE_ID });
    if (cleanupInterval) { clearInterval(cleanupInterval); cleanupInterval = null; cleanupIntervalMs = null; }
    initialized = false;
    destroyed = true;
    _metrics.shutdownCount++;
    _metrics.lastShutdownAt = Date.now();
    trackCacheEvent(`${TELEMETRY_EVENTS.SHUTDOWN}:complete`, { shutdownCount: _metrics.shutdownCount, moduleId: MODULE_ID });
    _log('info', 'Lifecycle shutdown');
    return true;
  },
  reset: () => {
    trackCacheEvent(`${TELEMETRY_EVENTS.RESET}:start`, { moduleId: MODULE_ID });
    if (cleanupInterval) { clearInterval(cleanupInterval); cleanupInterval = null; }
    cacheStore.clear();
    CacheStorage.resetMetrics?.();
    CachePolicies.resetEvictionStats?.();
    _metrics.resetCount++;
    _metrics.lastResetAt = Date.now();
    destroyed = false;
    trackCacheEvent(`${TELEMETRY_EVENTS.RESET}:complete`, { resetCount: _metrics.resetCount, moduleId: MODULE_ID });
    _log('info', 'Lifecycle reset');
    return true;
  },
  isInitialized: () => initialized && !destroyed,
  getStatus: () => {
    const stats = cacheStore.getStats();
    const storageStats: Record<string, unknown> = CacheStorage.getStats?.() || {};
    return {
      version: VERSION, moduleId: MODULE_ID, initialized, destroyed,
      size: stats.size, maxSize: stats.maxSize, hits: stats.hits, misses: stats.misses, evictions: stats.evictions,
      policy: CachePolicies.getPolicy(),
      cleanup: { intervalMs: cleanupIntervalMs, active: cleanupInterval !== null, scheduled: _metrics.cleanupScheduled },
      circuitBreaker: storageStats.circuitBreaker,
      metrics: { ..._metrics },
      uptime: _metrics.lastInitAt ? Date.now() - _metrics.lastInitAt : 0
    };
  },
  healthCheck: () => {
    const portsSnapshot = Ports.snapshot();
    const logger = _getPort('logger') as LoggerPort | null;
    const storageHealth: Record<string, unknown> = CacheStorage.healthCheck?.() || {};
    const stats = cacheStore.getStats();
    const checks = {
      initialized: initialized && !destroyed,
      storeAvailable: typeof cacheStore.getEntry === 'function',
      storageHealthy: storageHealth.status === 'HEALTHY',
      notAtCapacity: stats.size < stats.maxSize,
      cleanupScheduled: cleanupInterval !== null || !initialized,
      loggerReady: !!logger,
      portsInitialized: portsSnapshot._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const issues = [];
    if (!checks.initialized) issues.push('Not initialized');
    if (!checks.storeAvailable) issues.push('Store not available');
    if (!checks.storageHealthy) issues.push('Storage unhealthy');
    if (!checks.notAtCapacity) issues.push('At capacity');
    if (!checks.cleanupScheduled && initialized) issues.push('Cleanup not scheduled');
    return { status: passed === total ? 'HEALTHY' : (passed >= total / 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
  },
  info: () => {
    const portsSnapshot = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, debug: _debug, initialized, destroyed, cleanup: { intervalMs: cleanupIntervalMs, active: cleanupInterval !== null, limits: { min: CLEANUP.MIN_INTERVAL, max: CLEANUP.MAX_INTERVAL, default: CLEANUP.DEFAULT_INTERVAL } }, metrics: { ..._metrics }, healthCheck: CacheLifecycle.healthCheck(), portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
  },
  resetMetrics: () => { _metrics = { initCount: 0, resetCount: 0, shutdownCount: 0, cleanupScheduled: 0, lastInitAt: null as number | null, lastResetAt: null as number | null, lastShutdownAt: null as number | null }; },
  getStats: () => ({ version: VERSION, moduleId: MODULE_ID, initialized, destroyed, metrics: { ..._metrics }, uptime: _metrics.lastInitAt ? Date.now() - _metrics.lastInitAt : 0 }),
  injectPorts, getPorts
};

export function healthCheck() {
  return CacheLifecycle.healthCheck();
}

export function info() {
  return CacheLifecycle.info();
}

export { CacheLifecycle };
export default CacheLifecycle;
