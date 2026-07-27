// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.6.0-PATH-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: initializer
// PURPOSE: Initializer - Compatibility Wrapper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   (none)
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

export const VERSION = '5.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'main.core.initializer';

export * from './initializer/index.js';
export { default } from './initializer/index.js';
