// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.ports.auth
// PURPOSE: Main - Auth Port
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createAuthPort() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   isAuthenticated() — exported function
//   getUser() — exported function
//   getUserLevel() — exported function
//   login() — exported function
//   logout() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   AUTH_INTENTS.LOGOUT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';

const MODULE_ID = 'components.main.ports.auth';
const VERSION = '2.3.0-P18EC';

interface SessionManagerPort {
  isAuthenticated?(): boolean;
  getUser?(): Record<string, unknown> | null;
  login?(credentials: Record<string, unknown>): Promise<unknown>;
  logout?(): Promise<unknown>;
  [key: string]: unknown;
}

interface GlobalStatePort {
  get?(key: string): Record<string, unknown> | null;
  [key: string]: unknown;
}

interface EventBusPort {
  emit?(event: string, data: Record<string, unknown>): void;
  [key: string]: unknown;
}

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts(): void { Ports.init(); }
function _getPort(name: 'sessionManager'): SessionManagerPort | null;
function _getPort(name: 'globalState'): GlobalStatePort | null;
function _getPort(name: 'eventBus'): EventBusPort | null;
function _getPort(name: string): Record<string, unknown> | null;
function _getPort(name: string): Record<string, unknown> | null { return Ports.get(name) as Record<string, unknown> | null; }
export function injectPorts(p: Record<string, unknown>): boolean { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { checks: 0, logins: 0, logouts: 0 };

function isAuthenticated() { _metrics.checks++; const sessionManager = _getPort('sessionManager'); if (sessionManager && sessionManager.isAuthenticated) return sessionManager.isAuthenticated(); const gs = _getPort('globalState'); if (gs && gs.get) { const auth = gs.get('auth'); return auth && auth.isAuthenticated; } return false; }

function getUser() { const sessionManager = _getPort('sessionManager'); if (sessionManager && sessionManager.getUser) return sessionManager.getUser(); const gs = _getPort('globalState'); if (gs && gs.get) { const auth = gs.get('auth'); return auth && auth.user; } return null; }

function getUserLevel() { const user = getUser() as Record<string, unknown> | null; return user && user.level ? user.level : 0; }

function login(credentials: Record<string, unknown>) { _metrics.logins++; const sessionManager = _getPort('sessionManager'); if (sessionManager && sessionManager.login) return sessionManager.login(credentials); return Promise.reject(new Error('SessionManager not available')); }

function logout() { _metrics.logouts++; const sessionManager = _getPort('sessionManager'); if (sessionManager && sessionManager.logout) return sessionManager.logout(); const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(AUTH_INTENTS.LOGOUT, { source: MODULE_ID }); return Promise.resolve({ ok: true }); }

function init(ctx: Record<string, unknown> & { ports?: Record<string, unknown> }) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasSessionManager: { ok: !!_getPort('sessionManager'), severity: 'warn' }, isAuthenticated: { ok: isAuthenticated(), severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, isAuthenticated: isAuthenticated(), userLevel: getUserLevel(), metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

// Factory function for initializer.js compatibility
export function createAuthPort(options: Record<string, unknown> & { ports?: Record<string, unknown> }) {
  options = options || {};
  init(options);
  return {
    isAuthenticated,
    getUser,
    getUserLevel,
    login,
    logout,
    healthCheck,
    info,
    VERSION,
    MODULE_ID
  };
}

export function createNullAuthPort() {
  return { isAuthenticated: (): boolean => false, getUser: (): null => null, getUserLevel: (): number => 0, login: (): Promise<never> => Promise.reject(new Error('Null auth port')), logout: (): Promise<{ ok: boolean }> => Promise.resolve({ ok: true }) };
}

export function validateAuthPort(port: Record<string, unknown> | null | undefined) {
  return port && typeof port.isAuthenticated === 'function' && typeof port.getUser === 'function';
}

export { MODULE_ID, VERSION, init, isAuthenticated, getUser, getUserLevel, login, logout, healthCheck, info };
export default { MODULE_ID, VERSION, createAuthPort, createNullAuthPort, validateAuthPort, init, isAuthenticated, getUser, getUserLevel, login, logout, healthCheck, info, injectPorts, getPorts };
