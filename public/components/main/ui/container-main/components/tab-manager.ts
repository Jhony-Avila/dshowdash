// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-DI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: tab-manager
// PURPOSE: Container Tab Manager Component - Re-export
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

export const VERSION = '3.0.0-UX-ENHANCED';
export const MODULE_ID = 'main.ui.container-main.components.tab-manager';

export * from './tab-manager/index.js';
export { default } from './tab-manager/index.js';
