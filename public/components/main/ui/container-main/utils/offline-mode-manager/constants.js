const VERSION = "1.0.0";
const MODULE_ID = "container-main:offline-mode";
const OFFLINE_STATES = Object.freeze({
  ONLINE: "online",
  OFFLINE: "offline",
  SYNCING: "syncing"
});
const CACHE_STRATEGIES = Object.freeze({
  CACHE_FIRST: "cache-first",
  NETWORK_FIRST: "network-first",
  CACHE_ONLY: "cache-only",
  NETWORK_ONLY: "network-only",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate"
});
const DEFAULT_CONFIG = Object.freeze({
  strategy: CACHE_STRATEGIES.NETWORK_FIRST,
  cacheName: "dsd-container-main-v1",
  maxAge: 24 * 60 * 60 * 1e3,
  maxItems: 100,
  persistState: true,
  autoSync: true,
  syncInterval: 5 * 60 * 1e3,
  retryAttempts: 3,
  retryDelay: 1e3,
  offlineIndicator: true,
  queueOfflineRequests: true
});
const STORAGE_KEY = "dsd:container-main:offline-state";
const CACHE_METADATA_KEY = "dsd:container-main:cache-metadata";
export {
  CACHE_METADATA_KEY,
  CACHE_STRATEGIES,
  DEFAULT_CONFIG,
  MODULE_ID,
  OFFLINE_STATES,
  STORAGE_KEY,
  VERSION
};
