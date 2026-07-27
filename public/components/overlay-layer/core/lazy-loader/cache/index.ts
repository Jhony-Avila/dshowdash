// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Cache Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getCacheKey — exported value
//   getFromCache — exported value
//   addToCache — exported value
//   invalidate — exported value
//   invalidateAll — exported value
//   cleanExpired — exported value
//   getCacheInfo — exported value
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

export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lazy-loader.cache';

export { getCacheKey, getFromCache, addToCache } from './operations.js';
export { invalidate, invalidateAll, cleanExpired, getCacheInfo } from './management.js';
