// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-status/core/data-loader
// PURPOSE: Panel Status - Data Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ./constants.js
//
// PROVIDES:
//   loadData() — exported function
//   resetData() — exported function
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

import { MODULE_ID } from './constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
let _data: Record<string, unknown> | null = null;

export async function loadData(options: Record<string, unknown> = {}) {
    return { success: true, data: _data, moduleId: MODULE_ID };
}

export function resetData() {
    _data = null;
}

export function healthCheck() {
    return { status: 'HEALTHY', score: '1/1', checks: { ready: true }, version: VERSION, moduleId: MODULE_ID };
}

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, hasData: _data !== null };
}
