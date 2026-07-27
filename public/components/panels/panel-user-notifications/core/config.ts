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

export const MODULE_ID = 'panel-user-notifications.core.config';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel User Notifications - Configuration
 * @module panel-user-notifications/core/config
 * @version 1.1.0-AAA
 */

export const CONFIG = {
    panelId: 'panel-user-notifications',
    apiEndpoint: '/api/v1/notifications',
    refreshInterval: 15000,
    maxNotifications: 100,
    defaultPageSize: 20,
    features: {
        autoRefresh: true,
        markAsRead: true,
        bulkActions: true,
        filtering: true
    },
    types: {
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
        SUCCESS: 'success'
    }
};

export default CONFIG;
