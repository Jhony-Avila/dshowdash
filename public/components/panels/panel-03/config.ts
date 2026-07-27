// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-03/config
// PURPOSE: Panel-03 Media Manager - API Configuration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   API — exported value (endpoint map)
//   VERSION — module constant
//   MODULE_ID — module constant
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-03/config';

const BASE = '/api/modules/panels/panel-03';

export const API = {
    LIST: `${BASE}/files`,
    DELETE: `${BASE}/files/delete`,
    STAR: `${BASE}/files/star`,
    GET: `${BASE}/files/get`
};

export function healthCheck() {
    const checks = { endpointsConfigured: !!API.LIST && !!API.DELETE && !!API.STAR && !!API.GET };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, endpoints: Object.keys(API), healthCheck: healthCheck() };
}
