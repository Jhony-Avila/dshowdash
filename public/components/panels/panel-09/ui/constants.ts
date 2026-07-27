// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-09-ui
// PURPOSE: Panel-09 UI Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ALERT_THRESHOLD — exported value
//   PERIODS — exported value
//   STATUS_COLORS — exported value
//   STATUS_LABELS — exported value
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
export const MODULE_ID = 'panel-09-ui';
export const ALERT_THRESHOLD = 10;

// SVGs enterprise (substituem emojis)
const SVGS = {
  calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  calendarDays: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>',
  calendarRange: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>'
};

export const PERIODS = {
  today_vs_yesterday: { label: 'Diário', icon: SVGS.calendar, tabLabel: 'Hoje vs Ontem' },
  this_week_vs_last_week: { label: 'Semanal', icon: SVGS.calendarDays, tabLabel: 'Semana' },
  this_month_vs_last_month: { label: 'Mensal', icon: SVGS.calendarRange, tabLabel: 'Mês' }
};

export const STATUS_COLORS = {
  success: '#22c55e',
  error: '#ef4444',
  timeout: '#f59e0b',
  running: '#6366f1'
};

export const STATUS_LABELS = {
  success: 'Sucesso',
  error: 'Erro',
  timeout: 'Timeout',
  running: 'Executando'
};

export default { VERSION, MODULE_ID, ALERT_THRESHOLD, PERIODS, STATUS_COLORS, STATUS_LABELS };

export function info() { return { moduleId: 'panels-panel-09-ui-constants', version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-09-ui-constants', version: VERSION, checks: { constantsLoaded: true } }; }
