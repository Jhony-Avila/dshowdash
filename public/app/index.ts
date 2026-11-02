// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: app-index
// PURPOSE: App - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION from /core/version.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
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

export const MODULE_ID = 'app-index';
import { VERSION } from '/core/version.js'; export { VERSION };

export { AUTH_EVENTS, AUTH_STATES, ROUTER_EVENTS } from './events/index.js';
export { RouterGlobal, HistoryManager, RouteGuard, RouteResolver, RouteTransitions, URLParser, routerStore, routerTelemetry, getPorts, injectPorts, getVersion } from './router/index.js';
export { getSessionManager, checkSession, login, logout, getUser, getUserLevel, isAuthenticated, getAuthState } from './auth/index.js';

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
