// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail-controller
// PURPOSE: Panel Audit Trail - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   AUTO_REFRESH_SECONDS — exported value
//   PRESET_DAYS — exported value
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
export const MODULE_ID = 'panel-audit-trail-controller';
export const AUTO_REFRESH_SECONDS = 30;

export const PRESET_DAYS = {
  'LAST_15_MIN': 1,
  'LAST_HOUR': 1,
  'LAST_24H': 1,
  'TODAY': 1,
  'LAST_7_DAYS': 7,
  'LAST_30_DAYS': 30,
  'LAST_90_DAYS': 90
};

export default { VERSION, MODULE_ID, AUTO_REFRESH_SECONDS, PRESET_DAYS };

export function info() { return { moduleId: 'panels-panel-audit-trail-core-constants', version: VERSION || '1.0.0' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-audit-trail-core-constants', version: VERSION || '1.0.0', checks: { constantsLoaded: true } }; }
