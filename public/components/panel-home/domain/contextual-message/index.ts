// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Contextual Message Module - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   resolver from ./resolver.js
//
// PROVIDES:
//   buildContext — exported value
//   parsePlaceholders — exported value
//   requiresUserName — exported value
//   listPlaceholders — exported value
//   resolve — exported value
//   resolveFallback — exported value
//   clearHistory — exported value
//   getStats — exported value
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

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-home.domain.contextual-message';

export { buildContext } from './context-builder.js';
export { parsePlaceholders, requiresUserName, listPlaceholders } from './placeholder-parser.js';
export { resolve, resolveFallback, clearHistory, getStats } from './resolver.js';

// Re-export default do resolver como principal
import resolver from './resolver.js';
export default resolver;
