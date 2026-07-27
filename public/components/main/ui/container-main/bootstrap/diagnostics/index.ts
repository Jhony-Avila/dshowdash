// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Bootstrap Diagnostics - Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   performHealthCheck — exported value
//   getInfo — exported value
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.diagnostics';

export { performHealthCheck } from './health-check.js';
export { getInfo } from './info.js';
