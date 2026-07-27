// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08
// PURPOSE: Panel-08 Constants Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PAINEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   PANEL_NAME — exported value
//   REFRESH_INTERVAL_BASE — exported value
//   REFRESH_INTERVAL_DEGRADED — exported value
//   CSS_PATH — exported value
//   STATES — exported value
//   CONFIG — exported value
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

export const PAINEL_ID = 'panel-08';
export const MODULE_ID = 'panel-08.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const PANEL_NAME = 'Alertas do Sistema';
export const REFRESH_INTERVAL_BASE = 60000;
export const REFRESH_INTERVAL_DEGRADED = 180000;
export const CSS_PATH = '/components/panels/panel-08/styles/index.css';

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

// Configurações
export const CONFIG = Object.freeze({
  MAX_CONSECUTIVE_ERRORS: 3,
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_TIMEOUT: 30000,
  REQUEST_TIMEOUT: 10000,
  MAX_ALERTS_DISPLAY: 10
});

export default {
  PAINEL_ID,
  MODULE_ID,
  VERSION,
  PANEL_NAME,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  CSS_PATH,
  STATES,
  CONFIG
};

export function info() { return { moduleId: 'panels-panel-08-core-constants', version: VERSION || '1.0.0' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-08-core-constants', version: VERSION || '1.0.0', checks: { constantsLoaded: true } }; }
