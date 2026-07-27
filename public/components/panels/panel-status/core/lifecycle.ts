// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-status/core/lifecycle
// PURPOSE: Panel Status - Core Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID, VERSION from ./constants.js
//
// PROVIDES:
//   init() — exported function
//   destroy() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): container, options
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID, VERSION } from './constants.js';

let _initialized = false;

export function init(container: HTMLElement, options: Record<string, unknown> = {}) {
    _initialized = true;
    return { container, options, moduleId: MODULE_ID };
}

export function destroy() {
    _initialized = false;
}

export function healthCheck() {
    const checks = { initialized: _initialized };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, healthCheck: healthCheck() };
}
