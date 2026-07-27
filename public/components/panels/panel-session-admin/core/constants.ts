// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-core-constants
// PURPOSE: Panel Session Admin - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   AUTO_REFRESH_SECONDS — exported value
//   DEFAULT_HIDDEN_COLS — exported value
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels-panel-session-admin-core-constants';
export const AUTO_REFRESH_SECONDS = 30;
export const DEFAULT_HIDDEN_COLS = new Set(['expires', 'created']);

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } }; }

export default { VERSION, MODULE_ID, AUTO_REFRESH_SECONDS, DEFAULT_HIDDEN_COLS, info, healthCheck };
