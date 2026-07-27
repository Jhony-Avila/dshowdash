// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cache-manager.core.contracts
// PURPOSE: Global cache contracts for policies, TTL, limits and telemetry
// ───────────────────────────────────────────────────────────────
// @contract TTL - Time-to-live constants by category
// @contract SIZE - Size limits for keys and values
// @contract POLICIES - Eviction policy definitions (LRU/LFU/FIFO)
// @contract CLEANUP - Cleanup interval and batch settings
// @contract SWR - Stale-while-revalidate configuration
// @contract LOCAL_CACHE_EVENTS - Internal cache event names
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (pure contract module)
// PROVIDES: TTL, SIZE, POLICIES, CLEANUP, SWR, LOCAL_CACHE_EVENTS,
//   TELEMETRY_EVENTS, TELEMETRY_SCHEMA, ENDPOINT_CATEGORIES,
//   getTTLForEndpoint(), shouldCache(), validateTTL(), validateSize(),
//   info(), healthCheck()
// @changelog v3.2.1-STRICT-MODE: Strict mode integration in healthCheck/info
// @changelog v3.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.1.0-P18G2: TELEMETRY_EVENTS → LOCAL_CACHE_EVENTS (P18 GARGALO#2)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '3.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cache-manager.core.contracts';

// TTL CONTRACTS - Tempos padronizados por categoria
export const TTL = Object.freeze({
  STATIC: 3600000,
  CONFIG: 1800000,
  SESSION: 900000,
  AUTH: 300000,
  API_DEFAULT: 60000,
  API_FAST: 30000,
  API_REALTIME: 10000,
  UI_STATE: 120000,
  SEARCH: 180000,
  STALE_GRACE: 30000,
  MINIMUM: 5000,
  MAXIMUM: 86400000
});

// SIZE CONTRACTS - Limites de tamanho
export const SIZE = Object.freeze({
  MAX_KEY_LENGTH: 256,
  MAX_VALUE_SIZE: 102400,
  MAX_VALUE_WARN: 51200,
  DEFAULT_MAX_ENTRIES: 500,
  MIN_ENTRIES: 50,
  MAX_ENTRIES: 2000,
  MAX_DEPTH: 10,
  MAX_ARRAY_LENGTH: 1000,
  MAX_STRING_LENGTH: 50000
});

// POLICY CONTRACTS - Políticas de eviction
export const POLICIES = Object.freeze({
  LRU: 'lru',
  LFU: 'lfu',
  FIFO: 'fifo',
  DEFAULT: 'lru'
});

// CLEANUP CONTRACTS - Controle de limpeza
export const CLEANUP = Object.freeze({
  MIN_INTERVAL: 5000,
  DEFAULT_INTERVAL: 60000,
  MAX_INTERVAL: 300000,
  MAX_CLEANUP_TIME: 100,
  CIRCUIT_COOLDOWN: 30000,
  MAX_ENTRIES_PER_CYCLE: 100,
  BATCH_SIZE: 50
});

// STALE-WHILE-REVALIDATE CONTRACTS
export const SWR = Object.freeze({
  ENABLED: true,
  GRACE_PERIOD: 30000,
  MAX_STALE_AGE: 300000,
  REVALIDATE_TIMEOUT: 5000
});

// LOCAL CACHE EVENTS - Eventos internos do cache (P18G2: renomeado de TELEMETRY_EVENTS)
export const LOCAL_CACHE_EVENTS = Object.freeze({
  HIT: 'cache:hit',
  MISS: 'cache:miss',
  SET: 'cache:set',
  DELETE: 'cache:delete',
  CLEAR: 'cache:clear',
  EXPIRED: 'cache:expired',
  EVICT: 'cache:evict',
  INIT: 'cache:lifecycle:init',
  SHUTDOWN: 'cache:lifecycle:shutdown',
  RESET: 'cache:lifecycle:reset',
  CLEANUP_START: 'cache:cleanup:start',
  CLEANUP_COMPLETE: 'cache:cleanup:complete',
  CLEANUP_ERROR: 'cache:cleanup:error',
  CIRCUIT_BREAKER: 'cache:cleanup:circuit-breaker',
  BACKEND_HIT: 'cache:backend:hit',
  BACKEND_MISS: 'cache:backend:miss',
  GLOBALSTATE_SYNC: 'cache:globalstate:sync',
  ORCHESTRATOR_SYNC: 'cache:orchestrator:sync',
  SWR_STALE_SERVED: 'cache:swr:stale-served',
  SWR_REVALIDATE_START: 'cache:swr:revalidate-start',
  SWR_REVALIDATE_COMPLETE: 'cache:swr:revalidate-complete',
  SWR_REVALIDATE_ERROR: 'cache:swr:revalidate-error',
  VALUE_TOO_LARGE: 'cache:warning:value-too-large',
  KEY_TOO_LONG: 'cache:warning:key-too-long',
  CAPACITY_WARNING: 'cache:warning:capacity',
  FACTORY_ERROR: 'cache:factory:error',
  FACTORY_TIMEOUT: 'cache:factory:timeout'
});

// Legacy alias (deprecated - use LOCAL_CACHE_EVENTS)
export const TELEMETRY_EVENTS = LOCAL_CACHE_EVENTS;

// TELEMETRY SCHEMA - Campos obrigatórios por evento
export const TELEMETRY_SCHEMA = Object.freeze({
  [LOCAL_CACHE_EVENTS.HIT]: ['key', 'age', 'accessCount'],
  [LOCAL_CACHE_EVENTS.MISS]: ['key', 'reason'],
  [LOCAL_CACHE_EVENTS.SET]: ['key', 'ttl', 'size'],
  [LOCAL_CACHE_EVENTS.DELETE]: ['key'],
  [LOCAL_CACHE_EVENTS.EVICT]: ['key', 'policy', 'reason'],
  [LOCAL_CACHE_EVENTS.EXPIRED]: ['key', 'age'],
  [LOCAL_CACHE_EVENTS.CLEANUP_COMPLETE]: ['cleaned', 'duration', 'errors'],
  [LOCAL_CACHE_EVENTS.SWR_STALE_SERVED]: ['key', 'staleAge'],
  [LOCAL_CACHE_EVENTS.VALUE_TOO_LARGE]: ['key', 'size', 'maxSize']
});

// CATEGORIA DE CACHE POR ENDPOINT
export const ENDPOINT_CATEGORIES = Object.freeze({
  NO_CACHE: ['/api/auth/', '/api/session/', '/api/csrf/', '/api/logout'],
  REALTIME: ['/api/ticker/', '/api/alerts/', '/api/notifications/'],
  STANDARD: ['/api/panels/', '/api/cards/', '/api/data/'],
  STATIC: ['/api/config/', '/api/settings/', '/api/metadata/']
});

// HELPERS
export function getTTLForEndpoint(url: string): number {
  if (!url) return TTL.API_DEFAULT;
  for (const endpoint of ENDPOINT_CATEGORIES.NO_CACHE) { if (url.includes(endpoint)) return 0; }
  for (const endpoint of ENDPOINT_CATEGORIES.REALTIME) { if (url.includes(endpoint)) return TTL.API_REALTIME; }
  for (const endpoint of ENDPOINT_CATEGORIES.STATIC) { if (url.includes(endpoint)) return TTL.STATIC; }
  return TTL.API_DEFAULT;
}

export function shouldCache(url: string): boolean {
  if (!url) return true;
  for (const endpoint of ENDPOINT_CATEGORIES.NO_CACHE) { if (url.includes(endpoint)) return false; }
  return true;
}

export function validateTTL(ttl: unknown): number {
  if (typeof ttl !== 'number' || ttl < TTL.MINIMUM) return TTL.API_DEFAULT;
  if (ttl > TTL.MAXIMUM) return TTL.MAXIMUM;
  return ttl;
}

export function validateSize(size: unknown): number {
  if (typeof size !== 'number' || size < SIZE.MIN_ENTRIES) return SIZE.DEFAULT_MAX_ENTRIES;
  if (size > SIZE.MAX_ENTRIES) return SIZE.MAX_ENTRIES;
  return size;
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, ttl: TTL, size: SIZE, policies: POLICIES, cleanup: CLEANUP, swr: SWR, localCacheEvents: Object.keys(LOCAL_CACHE_EVENTS).length, endpointCategories: Object.keys(ENDPOINT_CATEGORIES).length, strictMode: isStrict(), timestamp: Date.now() };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { contractsReady: true }, strictMode: isStrict(), timestamp: Date.now() };
}

export default { VERSION, MODULE_ID, TTL, SIZE, POLICIES, CLEANUP, SWR, LOCAL_CACHE_EVENTS, TELEMETRY_EVENTS, TELEMETRY_SCHEMA, ENDPOINT_CATEGORIES, getTTLForEndpoint, shouldCache, validateTTL, validateSize, info, healthCheck };
