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
//   getConfig() — exported function
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

export const MODULE_ID = 'panel-13.core.config';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 13 - Configuration
 * @module panel-13/core/config
 * @version 1.1.0-AAA
 */

export const CONFIG = {
    panelId: 'panel-13',
    apiEndpoint: '/api/v1/panel-13',
    refreshInterval: 30000,
    maxItems: 100,
    defaultPageSize: 20,
    features: {
        autoRefresh: true,
        export: true,
        filtering: true,
        sorting: true
    }
};

export function getConfig(key: keyof typeof CONFIG | undefined): typeof CONFIG | typeof CONFIG[keyof typeof CONFIG] {
    return key ? CONFIG[key] : CONFIG;
}

export default CONFIG;
