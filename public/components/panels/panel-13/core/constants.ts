// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-13
// PURPOSE: Panel-13 Constants - FONTE CANÔNICA
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
//   CIRCUIT_BREAKER_THRESHOLD — exported value
//   CIRCUIT_BREAKER_TIMEOUT — exported value
//   REQUEST_TIMEOUT — exported value
//   MAX_CONSECUTIVE_ERRORS — exported value
//   PANEL_TITLE — exported value
//   PERIODS — exported value
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

export const PAINEL_ID = 'panel-13';
export const MODULE_ID = 'panel-13.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const REFRESH_INTERVAL_BASE = 60000;
export const REFRESH_INTERVAL_DEGRADED = 180000;
export const CSS_FILES = [
  '/components/panels/panel-13/styles/index.css'
];

// Circuit Breaker
export const CIRCUIT_BREAKER_THRESHOLD = 5;
export const CIRCUIT_BREAKER_TIMEOUT = 30000;
export const REQUEST_TIMEOUT = 10000;
export const MAX_CONSECUTIVE_ERRORS = 3;
export const PANEL_TITLE = 'Google Drive';

// Periods for filtering (added for index.js compatibility)
export const PERIODS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
  { value: 180, label: '6m' },
  { value: 365, label: '1a' },
  { value: 0, label: 'Tudo' }
];

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

export function info() { return { moduleId: 'panels-panel-13-core-constants', version: VERSION || '1.0.0' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-13-core-constants', version: VERSION || '1.0.0', checks: { constantsLoaded: true } }; }
