// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Offline Mode Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, OFFLINE_STATES, CACHE_STRATEGIES from ./constants.js
//   createOfflineModeManager, getOfflineModeManager, init, destroy, cachedFetch, ...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   OFFLINE_STATES — exported value
//   CACHE_STRATEGIES — exported value
//   createOfflineModeManager — exported value
//   getOfflineModeManager — exported value
//   init — exported value
//   destroy — exported value
//   cachedFetch — exported value
//   cacheUrl — exported value
//   getCached — exported value
//   clearCache — exported value
//   getCacheSize — exported value
//   queueRequest — exported value
//   setStrategy — exported value
//   subscribe — exported value
//   healthCheck — exported value
//   info — exported value
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

export { VERSION, MODULE_ID, OFFLINE_STATES, CACHE_STRATEGIES } from './constants.js';

export {
  createOfflineModeManager,
  getOfflineModeManager,
  init,
  destroy,
  cachedFetch,
  cacheUrl,
  getCached,
  clearCache,
  getCacheSize,
  queueRequest,
  setStrategy,
  subscribe,
  healthCheck,
  info
} from './api.js';

import { VERSION, MODULE_ID, OFFLINE_STATES, CACHE_STRATEGIES } from './constants.js';
import {
  createOfflineModeManager,
  getOfflineModeManager,
  init,
  destroy,
  cachedFetch,
  cacheUrl,
  getCached,
  clearCache,
  getCacheSize,
  queueRequest,
  setStrategy,
  subscribe,
  healthCheck,
  info
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  OFFLINE_STATES,
  CACHE_STRATEGIES,
  createOfflineModeManager,
  getOfflineModeManager,
  init,
  destroy,
  cachedFetch,
  cacheUrl,
  getCached,
  clearCache,
  getCacheSize,
  queueRequest,
  setStrategy,
  subscribe,
  healthCheck,
  info
};
