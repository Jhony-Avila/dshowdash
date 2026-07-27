// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cache-manager.core.storage
// PURPOSE: Cache storage operations with SWR and circuit breaker
// ───────────────────────────────────────────────────────────────
// @contract STORAGE_OPS - get/set/has/delete/clear operations
// @contract SWR - Stale-while-revalidate pattern support
// @contract CIRCUIT_BREAKER - Cleanup circuit breaker protection
// @contract PORTS - Integration via PortsFactory/PortsProfiles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   cacheStore from ../state/store.js
//   CachePolicies from ./policies.js
//   trackCacheEvent from ../telemetry/tracker.js
//   isExpired, calculateSize, sanitizeValue from ../utils/helpers.js
//   SIZE, CLEANUP, SWR, TELEMETRY_EVENTS, validateTTL from ./contracts.js
// PROVIDES: CacheStorage.get(), set(), has(), delete(), clear(),
//   getOrSet(), getOrSetAsync(), cleanExpired(), healthCheck(), info(),
//   injectPorts(), getPorts()
// @changelog v3.4.1-STRICT-MODE: Strict mode integration in healthCheck/info
// @changelog v3.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.3.0-ENTERPRISE: ES6 modernization
// @changelog v3.2.1-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { cacheStore } from '../state/store.js';
import { CachePolicies } from './policies.js';
import { trackCacheEvent } from '../telemetry/tracker.js';
import { isExpired, calculateSize, sanitizeValue } from '../utils/helpers.js';
import { SIZE, CLEANUP, SWR, TELEMETRY_EVENTS, validateTTL } from './contracts.js';

export const VERSION = '3.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cache-manager.core.storage';

type LoggerPort = { error?: (...a: unknown[]) => void; warn?: (...a: unknown[]) => void; debug?: (...a: unknown[]) => void };

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _debug = false;
let destroyed = false;
let _circuitBreakerOpen = false;
let _circuitBreakerOpenedAt: number | null = null;
let _lastCleanupTime = 0;
let _lastCleanupDuration = 0;

let _metrics = { gets: 0, sets: 0, deletes: 0, hits: 0, misses: 0, staleServed: 0, revalidations: 0, revalidationErrors: 0, cleanupRuns: 0, cleanupCleaned: 0, cleanupErrors: 0, circuitBreakerTrips: 0, valueTooLarge: 0, keyTooLong: 0 };

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger') as LoggerPort | null;
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; }
  if (_debug) logger.debug?.(`[${MODULE_ID}]`, ...args);
};

const _isCircuitBreakerOpen = () => {
  if (!_circuitBreakerOpen) return false;
  const elapsed = Date.now() - _circuitBreakerOpenedAt!;
  if (elapsed >= CLEANUP.CIRCUIT_COOLDOWN) {
    _circuitBreakerOpen = false;
    _circuitBreakerOpenedAt = null;
    _log('info', 'Circuit breaker closed after cooldown');
    return false;
  }
  return true;
};

const _isStaleButValid = (entry: { expiresAt: number }) => {
  if (!entry || !SWR.ENABLED) return false;
  const now = Date.now();
  if (now <= entry.expiresAt) return false;
  const staleAge = now - entry.expiresAt;
  return staleAge <= SWR.GRACE_PERIOD;
};

const CacheStorage = {
  setDebug: (debug: boolean) => { _debug = debug; },
  getVersion: () => VERSION,
  isInitialized: () => !destroyed,
  get: (key: string) => {
    _metrics.gets++;
    const entry = cacheStore.getEntry(key);
    if (!entry) {
      cacheStore.incrementMisses();
      _metrics.misses++;
      trackCacheEvent(TELEMETRY_EVENTS.MISS, { key, reason: 'not-found', moduleId: MODULE_ID });
      return null;
    }
    if (isExpired(entry)) {
      if (_isStaleButValid(entry)) {
        entry.accessCount++;
        entry.lastAccess = Date.now();
        cacheStore.incrementHits();
        _metrics.hits++;
        _metrics.staleServed++;
        const staleAge = Date.now() - entry.expiresAt;
        trackCacheEvent(TELEMETRY_EVENTS.SWR_STALE_SERVED, { key, staleAge, moduleId: MODULE_ID });
        return { value: entry.value, stale: true, staleAge };
      }
      cacheStore.deleteEntry(key);
      cacheStore.incrementMisses();
      cacheStore.incrementCleanedExpired();
      _metrics.misses++;
      const age = Date.now() - entry.createdAt;
      trackCacheEvent(TELEMETRY_EVENTS.EXPIRED, { key, age, moduleId: MODULE_ID });
      return null;
    }
    entry.accessCount++;
    entry.lastAccess = Date.now();
    cacheStore.incrementHits();
    _metrics.hits++;
    const entryAge = Date.now() - entry.createdAt;
    trackCacheEvent(TELEMETRY_EVENTS.HIT, { key, age: entryAge, accessCount: entry.accessCount, moduleId: MODULE_ID });
    return entry.value;
  },
  set: (key: string, value: unknown, ttl: number | null = null) => {
    _metrics.sets++;
    if (!key || typeof key !== 'string') { _log('warn', 'Invalid key'); return null; }
    if (key.length > SIZE.MAX_KEY_LENGTH) {
      _metrics.keyTooLong++;
      trackCacheEvent(TELEMETRY_EVENTS.KEY_TOO_LONG, { key: `${key.substring(0, 50)}...`, length: key.length, maxLength: SIZE.MAX_KEY_LENGTH, moduleId: MODULE_ID });
      _log('warn', 'Key too long:', key.length);
      return null;
    }
    const sanitized = sanitizeValue(value);
    const size = calculateSize(sanitized);
    if (size > SIZE.MAX_VALUE_SIZE) {
      _metrics.valueTooLarge++;
      trackCacheEvent(TELEMETRY_EVENTS.VALUE_TOO_LARGE, { key, size, maxSize: SIZE.MAX_VALUE_SIZE, moduleId: MODULE_ID });
      _log('warn', 'Value too large:', size, 'bytes for key:', key);
      return null;
    }
    if (size > SIZE.MAX_VALUE_WARN) _log('warn', 'Large value warning:', size, 'bytes for key:', key);
    let maxSize = cacheStore.get('maxSize');
    if (maxSize === undefined || maxSize === null) maxSize = SIZE.DEFAULT_MAX_ENTRIES;
    if (typeof maxSize === 'number' && maxSize > 0 && cacheStore.getSize() >= maxSize) CachePolicies.evict();
    const defaultTTL = cacheStore.get('defaultTTL');
    const validTTL = validateTTL(ttl !== null ? ttl : defaultTTL);
    const entry = cacheStore.setEntry(key, sanitized, validTTL);
    trackCacheEvent(TELEMETRY_EVENTS.SET, { key, ttl: validTTL, size, moduleId: MODULE_ID });
    return entry;
  },
  has: (key: string) => {
    const entry = cacheStore.getEntry(key);
    if (!entry) return false;
    if (isExpired(entry)) {
      if (_isStaleButValid(entry)) return true;
      cacheStore.deleteEntry(key);
      cacheStore.incrementCleanedExpired();
      return false;
    }
    return true;
  },
  delete: (key: string) => { _metrics.deletes++; const result = cacheStore.deleteEntry(key); trackCacheEvent(TELEMETRY_EVENTS.DELETE, { key, moduleId: MODULE_ID }); return result; },
  clear: () => { cacheStore.clear(); trackCacheEvent(TELEMETRY_EVENTS.CLEAR, { moduleId: MODULE_ID }); return true; },
  getOrSet: (key: string, factory: (() => unknown) | unknown, ttl: number | null = null) => {
    const cached = CacheStorage.get(key);
    if (cached !== null) {
      if (cached && typeof cached === 'object' && cached.stale) return cached.value;
      return cached;
    }
    try {
      const value = typeof factory === 'function' ? factory() : factory;
      CacheStorage.set(key, value, ttl);
      return value;
    } catch (error: any) {
      trackCacheEvent(TELEMETRY_EVENTS.FACTORY_ERROR, { key, error: error.message, moduleId: MODULE_ID });
      throw error;
    }
  },
  getOrSetAsync: (key: string, factory: () => Promise<unknown>, ttl: number | null = null, options: { revalidate?: boolean } & Record<string, unknown> = {}) => {
    const cached = CacheStorage.get(key);
    if (cached !== null) {
      if (cached && typeof cached === 'object' && cached.stale && options.revalidate !== false) {
        CacheStorage._revalidateInBackground(key, factory, ttl);
        return Promise.resolve(cached.value);
      }
      return Promise.resolve(cached);
    }
    return Promise.resolve()
      .then(() => factory())
      .then((value) => { CacheStorage.set(key, value, ttl); return value; })
      .catch((error) => { trackCacheEvent(TELEMETRY_EVENTS.FACTORY_ERROR, { key, error: error.message, moduleId: MODULE_ID }); throw error; });
  },
  _revalidateInBackground: (key: string, factory: () => Promise<unknown>, ttl: number | null) => {
    _metrics.revalidations++;
    trackCacheEvent(TELEMETRY_EVENTS.SWR_REVALIDATE_START, { key, moduleId: MODULE_ID });
    const timeoutPromise = new Promise((_, reject) => { setTimeout(() => reject(new Error('Revalidation timeout')), SWR.REVALIDATE_TIMEOUT); });
    Promise.race([factory(), timeoutPromise])
      .then((value) => { CacheStorage.set(key, value, ttl); trackCacheEvent(TELEMETRY_EVENTS.SWR_REVALIDATE_COMPLETE, { key, moduleId: MODULE_ID }); })
      .catch((error) => { _metrics.revalidationErrors++; trackCacheEvent(TELEMETRY_EVENTS.SWR_REVALIDATE_ERROR, { key, error: error.message, moduleId: MODULE_ID }); });
  },
  cleanExpired: () => {
    const now = Date.now();
    if (now - _lastCleanupTime < CLEANUP.MIN_INTERVAL) { _log('info', 'Cleanup throttled'); return 0; }
    if (_isCircuitBreakerOpen()) { _log('info', 'Cleanup skipped: circuit breaker open'); return 0; }
    _metrics.cleanupRuns++;
    _lastCleanupTime = now;
    let cleaned = 0;
    let errors = 0;
    const startTime = Date.now();
    trackCacheEvent(TELEMETRY_EVENTS.CLEANUP_START, { moduleId: MODULE_ID });
    try {
      const keys = cacheStore.getAllKeys();
      let processed = 0;
      for (const key of keys) {
        if (processed >= CLEANUP.MAX_ENTRIES_PER_CYCLE) { _log('info', 'Cleanup batch limit reached'); break; }
        try {
          const entry = cacheStore.getEntry(key);
          if (entry && isExpired(entry) && !_isStaleButValid(entry)) { cacheStore.deleteEntry(key); cleaned++; }
          processed++;
        } catch (e) { errors++; }
      }
      if (cleaned > 0) cacheStore.addCleanedExpired(cleaned);
      _metrics.cleanupCleaned += cleaned;
      _metrics.cleanupErrors += errors;
      const duration = Date.now() - startTime;
      _lastCleanupDuration = duration;
      if (duration > CLEANUP.MAX_CLEANUP_TIME) {
        _circuitBreakerOpen = true;
        _circuitBreakerOpenedAt = Date.now();
        _metrics.circuitBreakerTrips++;
        trackCacheEvent(TELEMETRY_EVENTS.CIRCUIT_BREAKER, { duration, threshold: CLEANUP.MAX_CLEANUP_TIME, cooldown: CLEANUP.CIRCUIT_COOLDOWN, moduleId: MODULE_ID });
        _log('warn', 'Circuit breaker tripped, cleanup took', duration, 'ms');
      }
      trackCacheEvent(TELEMETRY_EVENTS.CLEANUP_COMPLETE, { cleaned, duration, errors, processed, moduleId: MODULE_ID });
    } catch (error: any) {
      trackCacheEvent(TELEMETRY_EVENTS.CLEANUP_ERROR, { error: error.message, moduleId: MODULE_ID });
    }
    return cleaned;
  },
  getStats: () => ({
    version: VERSION, moduleId: MODULE_ID, destroyed, size: cacheStore.getSize(),
    maxSize: cacheStore.get('maxSize') || SIZE.DEFAULT_MAX_ENTRIES, metrics: { ..._metrics },
    circuitBreaker: { open: _circuitBreakerOpen, openedAt: _circuitBreakerOpenedAt, cooldown: CLEANUP.CIRCUIT_COOLDOWN },
    lastCleanup: { time: _lastCleanupTime, duration: _lastCleanupDuration }
  }),
  healthCheck: () => {
    const portsSnapshot = Ports.snapshot();
    const logger = _getPort('logger') as LoggerPort | null;
    const checks = { initialized: !destroyed, circuitBreakerClosed: !_circuitBreakerOpen, lowErrorRate: _metrics.cleanupErrors < 10, lowValueTooLarge: _metrics.valueTooLarge < 20, loggerReady: !!logger, portsInitialized: portsSnapshot._initialized };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : (passed >= total / 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
  },
  info: () => {
    const portsSnapshot = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, debug: _debug, destroyed, metrics: { ..._metrics }, swr: { enabled: SWR.ENABLED, gracePeriod: SWR.GRACE_PERIOD, staleServed: _metrics.staleServed, revalidations: _metrics.revalidations }, circuitBreaker: { open: _circuitBreakerOpen, trips: _metrics.circuitBreakerTrips }, healthCheck: CacheStorage.healthCheck(), portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
  },
  resetMetrics: () => { _metrics = { gets: 0, sets: 0, deletes: 0, hits: 0, misses: 0, staleServed: 0, revalidations: 0, revalidationErrors: 0, cleanupRuns: 0, cleanupCleaned: 0, cleanupErrors: 0, circuitBreakerTrips: 0, valueTooLarge: 0, keyTooLong: 0 }; },
  reset: () => { CacheStorage.clear(); CacheStorage.resetMetrics(); _circuitBreakerOpen = false; _circuitBreakerOpenedAt = null; _lastCleanupTime = 0; _lastCleanupDuration = 0; destroyed = false; },
  destroy: () => { CacheStorage.clear(); destroyed = true; },
  injectPorts, getPorts
};

export function healthCheck() {
  return CacheStorage.healthCheck();
}

export function info() {
  return CacheStorage.info();
}

export { CacheStorage };
export default CacheStorage;
