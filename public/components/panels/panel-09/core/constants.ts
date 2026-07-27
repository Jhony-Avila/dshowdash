// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-09
// PURPOSE: Panel-09 Constants - Análise Comparativa
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
//   REQUEST_TIMEOUT — exported value
//   MAX_CONSECUTIVE_ERRORS — exported value
//   CIRCUIT_BREAKER_THRESHOLD — exported value
//   CIRCUIT_BREAKER_TIMEOUT — exported value
//   CSS_PATH — exported value
//   STATES — exported value
//   COMPARISON_TYPES — exported value
//   METRICS — exported value
//   info() — exported function
//   ... and 1 more exports
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

export const PAINEL_ID = 'panel-09';
export const MODULE_ID = 'panel-09.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const PANEL_TITLE = 'Análise Comparativa';

export const REFRESH_INTERVAL_BASE = 300000;
export const REFRESH_INTERVAL_DEGRADED = 600000;
export const REQUEST_TIMEOUT = 15000;
export const MAX_CONSECUTIVE_ERRORS = 3;
export const CIRCUIT_BREAKER_THRESHOLD = 5;
export const CIRCUIT_BREAKER_TIMEOUT = 30000;

export const CSS_PATH = '/components/panels/panel-09/styles/index.css';

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

const SVGS = {
  calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  calendarDays: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>',
  calendarRange: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>',
  zap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  checkCircle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
};

export const COMPARISON_TYPES = {
  today_vs_yesterday: { label: 'Hoje vs Ontem', icon: SVGS.calendar, period: 'diário' },
  this_week_vs_last_week: { label: 'Esta Semana vs Anterior', icon: SVGS.calendarDays, period: 'semanal' },
  this_month_vs_last_month: { label: 'Este Mês vs Anterior', icon: SVGS.calendarRange, period: 'mensal' }
};

export const METRICS = {
  total: { label: 'Execuções', icon: SVGS.zap, format: 'number' },
  success: { label: 'Sucessos', icon: SVGS.checkCircle, format: 'number' },
  avg_time: { label: 'Tempo Médio', icon: SVGS.clock, format: 'time' }
};

export function info() { return { moduleId: 'panels-panel-09-core-constants', version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-09-core-constants', version: VERSION, checks: { constantsLoaded: true } }; }
