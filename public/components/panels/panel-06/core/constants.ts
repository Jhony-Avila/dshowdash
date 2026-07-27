// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-06
// PURPOSE: Panel-06 Constants
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
//   CSS_PATH — exported value
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

export const PAINEL_ID = 'panel-06';
export const MODULE_ID = 'panel-06';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const REFRESH_INTERVAL_BASE = 60000;
export const REFRESH_INTERVAL_DEGRADED = 180000;
export const CSS_PATH = '/components/panels/panel-06/styles/index.css';

export function info() { return { moduleId: 'panels-panel-06-core-constants', version: VERSION || '1.0.0' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-06-core-constants', version: VERSION || '1.0.0', checks: { constantsLoaded: true } }; }
