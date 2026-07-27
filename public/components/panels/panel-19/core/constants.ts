// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-19
// PURPOSE: Panel-19 Constants - FONTE CANÔNICA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PAINEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   REFRESH_INTERVAL_BASE — exported value
//   REFRESH_INTERVAL_DEGRADED — exported value
//   CSS_FILES — exported value
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

export const PAINEL_ID = 'panel-19';
export const MODULE_ID = 'panel-19.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const REFRESH_INTERVAL_BASE = 60000;
export const REFRESH_INTERVAL_DEGRADED = 180000;
export const CSS_FILES = [
  '/components/panels/panel-19/styles/index.css'
];

export function info() { return { moduleId: 'panels-panel-19-core-constants', version: VERSION || '1.0.0' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-19-core-constants', version: VERSION || '1.0.0', checks: { constantsLoaded: true } }; }
