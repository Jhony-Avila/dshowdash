// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: app.auth
// PURPOSE: Auth - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, AUTH_STATES, isAuthenticated, getAuthState from /app/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getSessionManager() — exported function
//   checkSession() — exported function
//   login() — exported function
//   logout() — exported function
//   getUser() — exported function
//   getUserLevel() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   AUTH_EVENTS — exported value
//   AUTH_STATES — exported value
//   isAuthenticated — exported value
//   getAuthState — exported value
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS, AUTH_STATES, isAuthenticated, getAuthState } from '/app/events/index.js';

export const VERSION = '1.1.1-P17WI';
export const MODULE_ID = 'app.auth';

export { AUTH_EVENTS, AUTH_STATES, isAuthenticated, getAuthState };

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function getSessionManager() { _initPorts(); return _getPort('sessionManager'); }
export function checkSession() { const sm = getSessionManager(); if (sm && sm.checkSession) return sm.checkSession(); return Promise.resolve({ ok: false, authenticated: false, error: 'SessionManager not available' }); }
export function login(credentials: unknown) { const sm = getSessionManager(); if (sm && sm.login) return sm.login(credentials); return Promise.resolve({ ok: false, error: 'SessionManager not available' }); }
export function logout() { const sm = getSessionManager(); if (sm && sm.logout) return sm.logout(); return Promise.resolve({ ok: false, error: 'SessionManager not available' }); }
export function getUser() { const sm = getSessionManager(); if (sm && sm.getUser) return sm.getUser(); return null; }
export function getUserLevel() { const sm = getSessionManager(); if (sm && sm.getUserLevel) return sm.getUserLevel(); return 0; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, sessionManagerAvailable: !!getSessionManager(), portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { const checks = { sessionManagerAvailable: !!getSessionManager(), portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, AUTH_EVENTS, AUTH_STATES, isAuthenticated, getAuthState, getSessionManager, checkSession, login, logout, getUser, getUserLevel, injectPorts, getPorts, info, healthCheck };
