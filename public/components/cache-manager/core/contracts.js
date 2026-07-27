import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "3.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.cache-manager.core.contracts";
const TTL = Object.freeze({
  STATIC: 36e5,
  CONFIG: 18e5,
  SESSION: 9e5,
  AUTH: 3e5,
  API_DEFAULT: 6e4,
  API_FAST: 3e4,
  API_REALTIME: 1e4,
  UI_STATE: 12e4,
  SEARCH: 18e4,
  STALE_GRACE: 3e4,
  MINIMUM: 5e3,
  MAXIMUM: 864e5
});
const SIZE = Object.freeze({
  MAX_KEY_LENGTH: 256,
  MAX_VALUE_SIZE: 102400,
  MAX_VALUE_WARN: 51200,
  DEFAULT_MAX_ENTRIES: 500,
  MIN_ENTRIES: 50,
  MAX_ENTRIES: 2e3,
  MAX_DEPTH: 10,
  MAX_ARRAY_LENGTH: 1e3,
  MAX_STRING_LENGTH: 5e4
});
const POLICIES = Object.freeze({
  LRU: "lru",
  LFU: "lfu",
  FIFO: "fifo",
  DEFAULT: "lru"
});
const CLEANUP = Object.freeze({
  MIN_INTERVAL: 5e3,
  DEFAULT_INTERVAL: 6e4,
  MAX_INTERVAL: 3e5,
  MAX_CLEANUP_TIME: 100,
  CIRCUIT_COOLDOWN: 3e4,
  MAX_ENTRIES_PER_CYCLE: 100,
  BATCH_SIZE: 50
});
const SWR = Object.freeze({
  ENABLED: true,
  GRACE_PERIOD: 3e4,
  MAX_STALE_AGE: 3e5,
  REVALIDATE_TIMEOUT: 5e3
});
const LOCAL_CACHE_EVENTS = Object.freeze({
  HIT: "cache:hit",
  MISS: "cache:miss",
  SET: "cache:set",
  DELETE: "cache:delete",
  CLEAR: "cache:clear",
  EXPIRED: "cache:expired",
  EVICT: "cache:evict",
  INIT: "cache:lifecycle:init",
  SHUTDOWN: "cache:lifecycle:shutdown",
  RESET: "cache:lifecycle:reset",
  CLEANUP_START: "cache:cleanup:start",
  CLEANUP_COMPLETE: "cache:cleanup:complete",
  CLEANUP_ERROR: "cache:cleanup:error",
  CIRCUIT_BREAKER: "cache:cleanup:circuit-breaker",
  BACKEND_HIT: "cache:backend:hit",
  BACKEND_MISS: "cache:backend:miss",
  GLOBALSTATE_SYNC: "cache:globalstate:sync",
  ORCHESTRATOR_SYNC: "cache:orchestrator:sync",
  SWR_STALE_SERVED: "cache:swr:stale-served",
  SWR_REVALIDATE_START: "cache:swr:revalidate-start",
  SWR_REVALIDATE_COMPLETE: "cache:swr:revalidate-complete",
  SWR_REVALIDATE_ERROR: "cache:swr:revalidate-error",
  VALUE_TOO_LARGE: "cache:warning:value-too-large",
  KEY_TOO_LONG: "cache:warning:key-too-long",
  CAPACITY_WARNING: "cache:warning:capacity",
  FACTORY_ERROR: "cache:factory:error",
  FACTORY_TIMEOUT: "cache:factory:timeout"
});
const TELEMETRY_EVENTS = LOCAL_CACHE_EVENTS;
const TELEMETRY_SCHEMA = Object.freeze({
  [LOCAL_CACHE_EVENTS.HIT]: ["key", "age", "accessCount"],
  [LOCAL_CACHE_EVENTS.MISS]: ["key", "reason"],
  [LOCAL_CACHE_EVENTS.SET]: ["key", "ttl", "size"],
  [LOCAL_CACHE_EVENTS.DELETE]: ["key"],
  [LOCAL_CACHE_EVENTS.EVICT]: ["key", "policy", "reason"],
  [LOCAL_CACHE_EVENTS.EXPIRED]: ["key", "age"],
  [LOCAL_CACHE_EVENTS.CLEANUP_COMPLETE]: ["cleaned", "duration", "errors"],
  [LOCAL_CACHE_EVENTS.SWR_STALE_SERVED]: ["key", "staleAge"],
  [LOCAL_CACHE_EVENTS.VALUE_TOO_LARGE]: ["key", "size", "maxSize"]
});
const ENDPOINT_CATEGORIES = Object.freeze({
  NO_CACHE: ["/api/auth/", "/api/session/", "/api/csrf/", "/api/logout"],
  REALTIME: ["/api/ticker/", "/api/alerts/", "/api/notifications/"],
  STANDARD: ["/api/panels/", "/api/cards/", "/api/data/"],
  STATIC: ["/api/config/", "/api/settings/", "/api/metadata/"]
});
function getTTLForEndpoint(url) {
  if (!url) return TTL.API_DEFAULT;
  for (const endpoint of ENDPOINT_CATEGORIES.NO_CACHE) {
    if (url.includes(endpoint)) return 0;
  }
  for (const endpoint of ENDPOINT_CATEGORIES.REALTIME) {
    if (url.includes(endpoint)) return TTL.API_REALTIME;
  }
  for (const endpoint of ENDPOINT_CATEGORIES.STATIC) {
    if (url.includes(endpoint)) return TTL.STATIC;
  }
  return TTL.API_DEFAULT;
}
function shouldCache(url) {
  if (!url) return true;
  for (const endpoint of ENDPOINT_CATEGORIES.NO_CACHE) {
    if (url.includes(endpoint)) return false;
  }
  return true;
}
function validateTTL(ttl) {
  if (typeof ttl !== "number" || ttl < TTL.MINIMUM) return TTL.API_DEFAULT;
  if (ttl > TTL.MAXIMUM) return TTL.MAXIMUM;
  return ttl;
}
function validateSize(size) {
  if (typeof size !== "number" || size < SIZE.MIN_ENTRIES) return SIZE.DEFAULT_MAX_ENTRIES;
  if (size > SIZE.MAX_ENTRIES) return SIZE.MAX_ENTRIES;
  return size;
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, ttl: TTL, size: SIZE, policies: POLICIES, cleanup: CLEANUP, swr: SWR, localCacheEvents: Object.keys(LOCAL_CACHE_EVENTS).length, endpointCategories: Object.keys(ENDPOINT_CATEGORIES).length, strictMode: isStrict(), timestamp: Date.now() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { contractsReady: true }, strictMode: isStrict(), timestamp: Date.now() };
}
var contracts_default = { VERSION, MODULE_ID, TTL, SIZE, POLICIES, CLEANUP, SWR, LOCAL_CACHE_EVENTS, TELEMETRY_EVENTS, TELEMETRY_SCHEMA, ENDPOINT_CATEGORIES, getTTLForEndpoint, shouldCache, validateTTL, validateSize, info, healthCheck };
export {
  CLEANUP,
  ENDPOINT_CATEGORIES,
  LOCAL_CACHE_EVENTS,
  MODULE_ID,
  POLICIES,
  SIZE,
  SWR,
  TELEMETRY_EVENTS,
  TELEMETRY_SCHEMA,
  TTL,
  VERSION,
  contracts_default as default,
  getTTLForEndpoint,
  healthCheck,
  info,
  shouldCache,
  validateSize,
  validateTTL
};
