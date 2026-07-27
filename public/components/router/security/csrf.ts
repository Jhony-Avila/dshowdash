// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.security.csrf
// PURPOSE: Router Security - CSRF Protection
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   getToken() — exported function
//   refreshToken() — exported function
//   validateToken() — exported function
//   getHeader() — exported function
//   getHeaderName() — exported function
//   setHeaderName() — exported function
//   injectIntoRequest() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.router.security.csrf';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; token: string | null; headerName: string; cookieName: string } = { initialized: false, token: null, headerName: 'X-CSRF-Token', cookieName: 'csrf_token' };
const _metrics = { generated: 0, validated: 0, rejected: 0 };

function _generateToken() { const array = new Uint8Array(32); if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(array); else for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256); return Array.from(array, b => b.toString(16).padStart(2, '0')).join(''); }

function getToken() { if (!_state.token) { _state.token = _generateToken(); _metrics.generated++; } return _state.token; }
function refreshToken() { _state.token = _generateToken(); _metrics.generated++; return _state.token; }
function validateToken(token: string) { _metrics.validated++; if (!token || token !== _state.token) { _metrics.rejected++; return false; } return true; }

function getHeader() { const obj: Record<string, string> = {}; obj[_state.headerName] = getToken(); return obj; }
function getHeaderName() { return _state.headerName; }
function setHeaderName(name: string) { _state.headerName = name; return { ok: true }; }

function injectIntoRequest(options: Record<string, any> = {}) {
  options.headers = options.headers || {};options.headers[_state.headerName] = getToken();return options;
}

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.headerName) _state.headerName = ctx.headerName as string; if (ctx && ctx.token) _state.token = ctx.token as string; else getToken(); _state.initialized = true; return { ok: true, version: VERSION }; }
function healthCheck() { return { status: _state.token ? 'HEALTHY' : 'DEGRADED', score: _state.token ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'warn' }, hasToken: { ok: !!_state.token, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, hasToken: !!_state.token, headerName: _state.headerName, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, getToken, refreshToken, validateToken, getHeader, getHeaderName, setHeaderName, injectIntoRequest, healthCheck, info };
export default { MODULE_ID, VERSION, init, getToken, refreshToken, validateToken, getHeader, getHeaderName, setHeaderName, injectIntoRequest, healthCheck, info, injectPorts, getPorts };
