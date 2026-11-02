// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-P2)
// ═══════════════════════════════════════════════════════════════
// MODULE: app-events-index
// PURPOSE: Events - Public API (granular re-exports)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   AUTH_EVENTS, AUTH_STATES from /core/runtime/events/catalog/auth.events.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   AUTH_EVENTS — re-exported value
//   AUTH_STATES — re-exported value
//   ROUTER_EVENTS — re-exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// @changelog v10.0.0-P2: Replaced barrel re-export with granular catalog imports
// @changelog v9.1.0-P18EC: Previous version (export * from barrel)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'app-events-index';
export const VERSION = '10.0.0-P2';

export { AUTH_EVENTS, AUTH_STATES } from '/core/runtime/events/catalog/auth.events.js';
export { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

export function info() { return { moduleId: MODULE_ID, version: VERSION, source: 'granular catalogs (P2)' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
