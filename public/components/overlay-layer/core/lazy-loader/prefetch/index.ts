// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Prefetch Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   prefetch — exported value
//   prefetchMany — exported value
//   processPrefetchQueue — exported value
//   getPrefetchQueueInfo — exported value
//   clearPrefetchQueue — exported value
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
export const MODULE_ID = 'overlay-layer.core.lazy-loader.prefetch';

export { prefetch, prefetchMany, processPrefetchQueue, getPrefetchQueueInfo, clearPrefetchQueue } from './manager.js';
