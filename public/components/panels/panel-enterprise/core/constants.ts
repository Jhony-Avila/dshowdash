// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-enterprise
// PURPOSE: Panel Enterprise - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   EVENTS — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_ID — exported value
//   FEATURES — exported value
//   UI_ACTIONS — exported value
//   ICONS — exported value
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
export const MODULE_ID = 'panel-enterprise.core.constants';
export const PANEL_ID = 'panel-enterprise';

export const FEATURES = Object.freeze({
  ADVANCED_ANALYTICS: { id: 'advanced-analytics', label: 'Analytics Avançado', icon: 'bar-chart', status: 'coming-soon' },
  CUSTOM_REPORTS: { id: 'custom-reports', label: 'Relatórios Customizados', icon: 'file-text', status: 'coming-soon' },
  API_ACCESS: { id: 'api-access', label: 'Acesso API', icon: 'code', status: 'coming-soon' },
  WHITE_LABEL: { id: 'white-label', label: 'White Label', icon: 'palette', status: 'coming-soon' },
  MULTI_TENANT: { id: 'multi-tenant', label: 'Multi-Tenant', icon: 'users', status: 'coming-soon' },
  SSO: { id: 'sso', label: 'Single Sign-On', icon: 'key', status: 'coming-soon' },
  AUDIT_LOG: { id: 'audit-log', label: 'Log de Auditoria', icon: 'shield', status: 'coming-soon' },
  PRIORITY_SUPPORT: { id: 'priority-support', label: 'Suporte Prioritário', icon: 'headphones', status: 'coming-soon' }
});

// P18G2: EVENTS removed - use import { PANEL_EVENTS } from '/core/runtime/events/index.js'
// Local UI actions (not EventBus events) - renamed to avoid confusion
export const UI_ACTIONS = Object.freeze({
  FEATURE_CLICKED: 'feature:clicked',
  UPGRADE_REQUESTED: 'upgrade:requested'
});

export const ICONS = Object.freeze({
  building: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',
  lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  star: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
});

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { VERSION, MODULE_ID, PANEL_ID, FEATURES, UI_ACTIONS, ICONS };
