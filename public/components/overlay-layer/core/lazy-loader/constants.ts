// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-lazy-loader
// PURPOSE: Lazy Loader - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LOAD_STATUS — exported value
//   DEFAULT_CONFIG — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer-lazy-loader';

export const LOAD_STATUS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  LOADED: 'LOADED',
  ERROR: 'ERROR'
};

export const DEFAULT_CONFIG = {
  enabled: true,
  prefetchEnabled: true,
  prefetchDelay: 1000,
  cacheEnabled: true,
  cacheTTL: 300000,
  maxCacheSize: 50,
  timeout: 10000,
  retryAttempts: 2,
  retryDelay: 500
};
