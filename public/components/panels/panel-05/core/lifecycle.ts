// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05/core/lifecycle
// PURPOSE: Panel-05 Cliente360 - Core Lifecycle Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_ID from ./constants.js
//
// PROVIDES:
//   initLifecycle() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { PANEL_ID } from './constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05/core/lifecycle';

let _initialized = false;
let _container: HTMLElement | null = null;

export async function initLifecycle(container: HTMLElement, options: Record<string, unknown> = {}) {
    _container = container;
    _initialized = true;

    const instance = {
        panelId: PANEL_ID,
        container,
        options,
        destroy() {
            _initialized = false;
            _container = null;
        },
        healthCheck() {
            return { status: _initialized ? 'HEALTHY' : 'UNHEALTHY', moduleId: MODULE_ID };
        }
    };

    return instance;
}

export function healthCheck() {
    const checks = { initialized: _initialized, containerReady: !!_container };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, panelId: PANEL_ID, healthCheck: healthCheck() };
}
