// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-14
// PURPOSE: Panel-14 Constants - FONTE CANÔNICA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PAINEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   PANEL_TITLE — exported value
//   REFRESH_INTERVAL_BASE — exported value
//   REFRESH_INTERVAL_DEGRADED — exported value
//   CSS_FILES — exported value
//   CIRCUIT_BREAKER_THRESHOLD — exported value
//   CIRCUIT_BREAKER_TIMEOUT — exported value
//   REQUEST_TIMEOUT — exported value
//   MAX_CONSECUTIVE_ERRORS — exported value
//   STATES — exported value
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

export const PAINEL_ID = 'panel-14';
export const MODULE_ID = 'panel-14.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const PANEL_TITLE = 'Importação';
export const REFRESH_INTERVAL_BASE = 60000;
export const REFRESH_INTERVAL_DEGRADED = 180000;
export const CSS_FILES = [
  '/components/panels/panel-14/styles/index.css'
];

// Circuit Breaker
export const CIRCUIT_BREAKER_THRESHOLD = 5;
export const CIRCUIT_BREAKER_TIMEOUT = 30000;
export const REQUEST_TIMEOUT = 10000;
export const MAX_CONSECUTIVE_ERRORS = 3;

// Estados do painel
export const STATES = Object.freeze({
  IDLE: 'IDLE',
  MOUNTING: 'MOUNTING',
  MOUNTED: 'MOUNTED',
  LOADING: 'LOADING',
  READY: 'READY',
  ERROR: 'ERROR',
  DEGRADED: 'DEGRADED',
  UNMOUNTING: 'UNMOUNTING',
  DESTROYED: 'DESTROYED'
});

export function info() { return { moduleId: 'panels-panel-14-core-constants', version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-14-core-constants', version: VERSION, checks: { constantsLoaded: true } }; }
