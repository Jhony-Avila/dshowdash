// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.monitoring.mock-mode
// PURPOSE: Router Monitoring - Mock Mode
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
//   cleanup() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   registerMock() — exported function
//   unregisterMock() — exported function
//   clearMocks() — exported function
//   intercept() — exported function
//   getInterceptedCalls() — exported function
//   clearInterceptedCalls() — exported function
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

const MODULE_ID = 'components.router.monitoring.mock-mode';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; enabled: boolean; mocks: Record<string, unknown>; interceptedCalls: { path: string; timestamp: number }[] } = { initialized: false, enabled: false, mocks: {}, interceptedCalls: [] };
const _metrics = { intercepted: 0, passthrough: 0 };

function enable() { _state.enabled = true; return { ok: true }; }
function disable() { _state.enabled = false; return { ok: true }; }
function isEnabled() { return _state.enabled; }

function registerMock(path: string, response: unknown) { _state.mocks[path] = response; return { ok: true, path }; }
function unregisterMock(path: string) { if (_state.mocks[path]) { delete _state.mocks[path]; return { ok: true }; } return { ok: false, reason: 'Not found' }; }
function clearMocks() { _state.mocks = {}; return { ok: true }; }

function intercept(path: string) { if (!_state.enabled) { _metrics.passthrough++; return { intercepted: false }; } if (_state.mocks[path]) { _metrics.intercepted++; _state.interceptedCalls.push({ path, timestamp: Date.now() }); return { intercepted: true, response: _state.mocks[path] }; } _metrics.passthrough++; return { intercepted: false }; }

function getInterceptedCalls() { return _state.interceptedCalls.slice(); }
function clearInterceptedCalls() { _state.interceptedCalls = []; return { ok: true }; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.enabled) _state.enabled = ctx.enabled as boolean; _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { _state.mocks = {}; _state.interceptedCalls = []; _state.enabled = false; _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, mockMode: { ok: !_state.enabled, severity: 'info', message: _state.enabled ? 'Mock mode active' : 'Production mode' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, enabled: _state.enabled, mocksCount: Object.keys(_state.mocks).length, interceptedCount: _state.interceptedCalls.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, cleanup, enable, disable, isEnabled, registerMock, unregisterMock, clearMocks, intercept, getInterceptedCalls, clearInterceptedCalls, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, enable, disable, isEnabled, registerMock, unregisterMock, clearMocks, intercept, getInterceptedCalls, clearInterceptedCalls, healthCheck, info, injectPorts, getPorts };
