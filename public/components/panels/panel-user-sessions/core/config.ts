// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: config
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   CONFIG — exported value
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

export const MODULE_ID = 'panel-user-sessions.core.config';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel User Sessions - Configuration
 * @module panel-user-sessions/core/config
 * @version 1.1.0-AAA
 */

export const CONFIG = {
    panelId: 'panel-user-sessions',
    apiEndpoint: '/api/v1/sessions',
    refreshInterval: 30000,
    maxSessions: 100,
    defaultPageSize: 20,
    features: {
        autoRefresh: true,
        export: true,
        filtering: true,
        sorting: true
    },
    columns: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'user', label: 'Usuário', sortable: true },
        { key: 'device', label: 'Dispositivo', sortable: true },
        { key: 'ip', label: 'IP', sortable: true },
        { key: 'startedAt', label: 'Início', sortable: true },
        { key: 'lastActivity', label: 'Última Atividade', sortable: true },
        { key: 'status', label: 'Status', sortable: true }
    ]
};

export default CONFIG;
