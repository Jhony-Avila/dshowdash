// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12
// PURPOSE: Panel-12 Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PANEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   REFRESH_INTERVAL_BASE — exported value
//   REFRESH_INTERVAL_DEGRADED — exported value
//   SEARCH_DEBOUNCE_MS — exported value
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

export const PANEL_ID = 'painel-12';
export const MODULE_ID = 'panel-12.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const REFRESH_INTERVAL_BASE = 30000;
export const REFRESH_INTERVAL_DEGRADED = 120000;
export const SEARCH_DEBOUNCE_MS = 300;
export const CSS_PATH = '/components/panels/panel-12/styles/index.css';

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } }; }
