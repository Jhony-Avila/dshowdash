// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin
// PURPOSE: Panel Nav Admin Constants - Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   PANEL_ID — exported value
//   MODULE_ID — module constant
//   PANEL_TITLE — exported value
//   PANEL_DESCRIPTION — exported value
//   API_PATH — exported value
//   API_VALIDATE_PATH — exported value
//   CSS_PATH — exported value
//   REFRESH_INTERVAL — exported value
//   REQUEST_TIMEOUT — exported value
//   DEBOUNCE_DELAY — exported value
//   ITEMS_PER_PAGE — exported value
//   STATES — exported value
//   EXPORT_FORMATS — exported value
//   SHORTCUTS — exported value
//   ... and 4 more exports
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
export const PANEL_ID = 'panel-nav-admin';
export const MODULE_ID = 'panel-nav-admin.core.constants';
export const PANEL_TITLE = 'Administração de Navegação';
export const PANEL_DESCRIPTION = 'Gerencie itens e seções da sidebar';

// Paths
export const API_PATH = '/api/admin/navigation/index.php';
export const API_VALIDATE_PATH = '/api/admin/navigation/validate.php';
export const CSS_PATH = '/components/panels/panel-nav-admin/styles.css';

// Timing
export const REFRESH_INTERVAL = 120000;
export const REQUEST_TIMEOUT = 15000;
export const DEBOUNCE_DELAY = 300;

// Pagination (desabilitada — exibir todos os itens sem paginação)
export const ITEMS_PER_PAGE = 9999;

// States
export const STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    SAVING: 'saving',
    ERROR: 'error',
    DETAIL: 'detail'
};

// Export formats
export const EXPORT_FORMATS = ['json', 'csv'];

// Keyboard shortcuts
export const SHORTCUTS = {
    REFRESH: 'r',
    NEW_ITEM: 'n',
    SEARCH: '/',
    ESCAPE: 'Escape',
    SAVE: 'ctrl+s'
};

// Tab IDs
export const TABS = {
    ITEMS: 'items',
    SECTIONS: 'sections',
    DIAGNOSTIC: 'diagnostic'
};

// Health status thresholds
export const HEALTH_THRESHOLDS = {
    HEALTHY: 90,
    GOOD: 75,
    DEGRADED: 50,
    WARNING: 25
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } }; }

export default {
    PANEL_ID, MODULE_ID, VERSION, PANEL_TITLE, PANEL_DESCRIPTION,
    API_PATH, API_VALIDATE_PATH, CSS_PATH,
    REFRESH_INTERVAL, REQUEST_TIMEOUT, DEBOUNCE_DELAY, ITEMS_PER_PAGE,
    STATES, EXPORT_FORMATS, SHORTCUTS, TABS, HEALTH_THRESHOLDS,
    info, healthCheck
};
