// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04/core/constants
// PURPOSE: Panel-04 Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   PAINEL_ID — exported value
//   PANEL_TITLE — exported value
//   REFRESH_INTERVAL_SECONDS — exported value
//   REQUEST_TIMEOUT — exported value
//   MAX_CONSECUTIVE_ERRORS — exported value
//   CIRCUIT_BREAKER_THRESHOLD — exported value
//   CIRCUIT_BREAKER_TIMEOUT — exported value
//   STATES — exported value
//   ALERT_TYPES — exported value
//   DEFAULT_PERFORMANCE_METRICS — exported value
//   getErrorMessage() — exported function
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

export const MODULE_ID = 'panel-04/core/constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const PAINEL_ID = 'panel-04';
export const PANEL_TITLE = 'Tabela de Incidentes';

// Intervalos e timeouts
export const REFRESH_INTERVAL_SECONDS = 60;
export const REQUEST_TIMEOUT = 15000;
export const MAX_CONSECUTIVE_ERRORS = 3;
export const CIRCUIT_BREAKER_THRESHOLD = 5;
export const CIRCUIT_BREAKER_TIMEOUT = 30000;

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

// SVGs de severidade (círculos coloridos)
const SEVERITY_SVGS = {
  critical: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#dc2626"/></svg>',
  high: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444"/></svg>',
  medium: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f59e0b"/></svg>',
  low: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e"/></svg>'
};

// Tipos de alerta
export const ALERT_TYPES = Object.freeze({
  'alert-critical': { label: 'Crítico', color: '#dc2626', bg: 'rgba(220,38,38,0.15)', icon: SEVERITY_SVGS.critical, order: 0 },
  'alert-high': { label: 'Alto', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: SEVERITY_SVGS.high, order: 1 },
  'alert-medium': { label: 'Médio', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: SEVERITY_SVGS.medium, order: 2 },
  'alert-low': { label: 'Baixo', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: SEVERITY_SVGS.low, order: 3 }
});

// Métricas de performance padrão
export const DEFAULT_PERFORMANCE_METRICS = Object.freeze({
  mountTime: 0,
  avgLoadTime: 0,
  totalRequests: 0,
  failedRequests: 0,
  successRate: 100
});

// Helper para mensagens de erro
export function getErrorMessage(error: unknown) {
  if (!error) return 'Erro desconhecido';
  if (typeof error === 'string') return error;
  const e = error as Record<string, unknown>;
  return (e.message as string) || (e.error as string) || 'Erro desconhecido';
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { 
  return { 
    status: 'HEALTHY', 
    moduleId: MODULE_ID, 
    version: VERSION,
    constants: { statesCount: Object.keys(STATES).length, alertTypesCount: Object.keys(ALERT_TYPES).length }
  }; 
}

export default { 
  MODULE_ID, VERSION, PAINEL_ID, PANEL_TITLE,
  REFRESH_INTERVAL_SECONDS, REQUEST_TIMEOUT, MAX_CONSECUTIVE_ERRORS,
  CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT,
  STATES, ALERT_TYPES, DEFAULT_PERFORMANCE_METRICS
};
