// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin
// PURPOSE: Panel Feature Flags Admin - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PANEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   API_BASE — exported value
//   REFRESH_INTERVAL — exported value
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

export const PANEL_ID = 'panel-feature-flags-admin';
export const MODULE_ID = 'panel-feature-flags-admin.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const API_BASE = '/api/feature-flags';
export const REFRESH_INTERVAL = 30;
export const REFRESH_INTERVAL_DEGRADED = 90;

export const CSS_FILES = [
  '/components/panels/panel-feature-flags-admin/styles/index.css'
];

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } }; }
