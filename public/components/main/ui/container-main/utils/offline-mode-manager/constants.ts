// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:offline-mode
// PURPOSE: Offline Mode Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   OFFLINE_STATES — exported value
//   CACHE_STRATEGIES — exported value
//   DEFAULT_CONFIG — exported value
//   STORAGE_KEY — exported value
//   CACHE_METADATA_KEY — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0';
export const MODULE_ID = 'container-main:offline-mode';

export const OFFLINE_STATES = Object.freeze({
  ONLINE: 'online',
  OFFLINE: 'offline',
  SYNCING: 'syncing'
});

export const CACHE_STRATEGIES = Object.freeze({
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
});

export const DEFAULT_CONFIG = Object.freeze({
  strategy: CACHE_STRATEGIES.NETWORK_FIRST,
  cacheName: 'dsd-container-main-v1',
  maxAge: 24 * 60 * 60 * 1000,
  maxItems: 100,
  persistState: true,
  autoSync: true,
  syncInterval: 5 * 60 * 1000,
  retryAttempts: 3,
  retryDelay: 1000,
  offlineIndicator: true,
  queueOfflineRequests: true
});

export const STORAGE_KEY = 'dsd:container-main:offline-state';
export const CACHE_METADATA_KEY = 'dsd:container-main:cache-metadata';
