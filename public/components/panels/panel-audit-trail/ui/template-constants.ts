// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail-template
// PURPOSE: Panel Audit Trail - Template Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABS, TIME_PRESETS, SEVERITY, MODULES from ../core/contracts.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CSS_PREFIX — exported value
//   COLUMNS — exported value
//   TABS — exported value
//   TIME_PRESETS — exported value
//   SEVERITY — exported value
//   MODULES — exported value
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

import { TABS, TIME_PRESETS, SEVERITY, MODULES } from '../core/contracts.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-audit-trail-template';
export const CSS_PREFIX = 'pat';

export const COLUMNS = {
  [TABS.AUDIT]: [
    { key: 'created_at', label: 'Data/Hora', sortable: true, visible: true, filterable: false },
    { key: 'username', label: 'Usuário', sortable: true, visible: true, filterable: true, filterType: 'text' },
    { key: 'action_type', label: 'Ação', sortable: true, visible: true, filterable: true, filterType: 'select', filterOptions: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'] },
    { key: 'resource_type', label: 'Recurso', sortable: false, visible: true, filterable: true, filterType: 'text' },
    { key: 'module', label: 'Módulo', sortable: true, visible: true, filterable: true, filterType: 'select', filterOptions: ['auth', 'users', 'permissions', 'settings', 'dashboard', 'api'] },
    { key: 'actions', label: '', sortable: false, visible: true, filterable: false }
  ],
  [TABS.PERMISSIONS]: [
    { key: 'created_at', label: 'Data/Hora', sortable: true, visible: true, filterable: false },
    { key: 'username', label: 'Usuário', sortable: true, visible: true, filterable: true, filterType: 'text' },
    { key: 'permission_key', label: 'Permissão', sortable: true, visible: true, filterable: true, filterType: 'text' },
    { key: 'action', label: 'Ação', sortable: true, visible: true, filterable: true, filterType: 'select', filterOptions: ['GRANT', 'REVOKE', 'CHECK'] },
    { key: 'resource_type', label: 'Recurso', sortable: false, visible: true, filterable: true, filterType: 'text' },
    { key: 'ip_address', label: 'IP', sortable: false, visible: true, filterable: true, filterType: 'text' },
    { key: 'actions', label: '', sortable: false, visible: true, filterable: false }
  ],
  [TABS.FRONTEND]: [
    { key: 'created_at', label: 'Data/Hora', sortable: true, visible: true, filterable: false },
    { key: 'log_level', label: 'Nível', sortable: true, visible: true, filterable: true, filterType: 'select', filterOptions: ['error', 'warn', 'warning', 'info', 'debug'] },
    { key: 'logger_name', label: 'Logger', sortable: true, visible: true, filterable: true, filterType: 'text' },
    { key: 'message', label: 'Mensagem', sortable: false, visible: true, filterable: true, filterType: 'text' },
    { key: 'page_url', label: 'URL', sortable: false, visible: true, filterable: true, filterType: 'text' },
    { key: 'actions', label: '', sortable: false, visible: true, filterable: false }
  ],
  [TABS.SECURITY]: [
    { key: 'created_at', label: 'Data/Hora', sortable: true, visible: true, filterable: false },
    { key: 'severity', label: 'Severidade', sortable: true, visible: true, filterable: true, filterType: 'select', filterOptions: ['critical', 'high', 'medium', 'low', 'info'] },
    { key: 'event_type', label: 'Tipo', sortable: true, visible: true, filterable: true, filterType: 'select', filterOptions: ['LOGIN_FAILED', 'SUSPICIOUS_ACTIVITY', 'PERMISSION_DENIED', 'RATE_LIMIT', 'CSRF_VIOLATION'] },
    { key: 'username', label: 'Usuário', sortable: true, visible: true, filterable: true, filterType: 'text' },
    { key: 'resource', label: 'Recurso', sortable: false, visible: true, filterable: true, filterType: 'text' },
    { key: 'details', label: 'Detalhes', sortable: false, visible: true, filterable: false },
    { key: 'actions', label: '', sortable: false, visible: true, filterable: false }
  ]
};

export { TABS, TIME_PRESETS, SEVERITY, MODULES };
export default { VERSION, MODULE_ID, CSS_PREFIX, COLUMNS, TABS, TIME_PRESETS };

