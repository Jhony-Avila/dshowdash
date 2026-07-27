// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Loaders Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   registerLoader — exported value
//   unregisterLoader — exported value
//   findLoader — exported value
//   getRegisteredLoaders — exported value
//   loadWithRetry — exported value
//   load — exported value
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
export const MODULE_ID = 'overlay-layer.core.lazy-loader.loaders';

export { registerLoader, unregisterLoader, findLoader, getRegisteredLoaders } from './registry.js';
export { loadWithRetry, load } from './execute.js';
