// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.status-user
// PURPOSE: Footer - Status User
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   USER_EVENTS — exported value
//   init() — exported function
//   setUser() — exported function
//   getUser() — exported function
//   getUserName() — exported function
//   getUserLevel() — exported function
//   isAuthenticated() — exported function
//   render() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.footer.status-user';
const VERSION = '2.2.0-P18EC';

const USER_EVENTS = { CHANGED: 'footer:user:changed' };

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, user: (null as Record<string,unknown>|null) };
const _metrics = { updates: 0 };

function _emit(eventName: string, data: Record<string,unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }

function setUser(user: Record<string,unknown>) { _state.user = user; _metrics.updates++; _emit(USER_EVENTS.CHANGED, { user }); return { ok: true }; }
function getUser() { return _state.user; }
function getUserName() { return _state.user ? _state.user.name || _state.user.username : 'Visitante'; }
function getUserLevel() { return _state.user && _state.user.level ? _state.user.level : 0; }
function isAuthenticated() { return !!_state.user; }
function render() { return `<span class="footer-user">${getUserName()}</span>`; }

// @ts-expect-error TS migration - TS2345, TS2322
function init(ctx: Record<string,unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); if (ctx && ctx.user) _state.user = ctx.user; _state.initialized = true; return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, isAuthenticated: isAuthenticated(), userName: getUserName(), metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, USER_EVENTS, init, setUser, getUser, getUserName, getUserLevel, isAuthenticated, render, healthCheck, info };
export default { MODULE_ID, VERSION, USER_EVENTS, init, setUser, getUser, getUserName, getUserLevel, isAuthenticated, render, healthCheck, info, injectPorts, getPorts };
