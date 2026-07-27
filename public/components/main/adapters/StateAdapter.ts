// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.adapters.state
// PURPOSE: Main - State Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createStateAdapter() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   get() — exported function
//   set() — exported function
//   subscribe() — exported function
//   getAll() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.main.adapters.state';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _localState: Record<string, unknown> = {};
const _metrics = { gets: 0, sets: 0, subscribes: 0 };

function get(key: string) { _metrics.gets++; const gs = _getPort('globalState'); if (gs && (gs as Record<string, unknown>).get) return (gs as Record<string, (...args: unknown[]) => unknown>).get(key); return _localState[key]; }

function set(key: string, value: unknown) { _metrics.sets++; const gs = _getPort('globalState'); if (gs && (gs as Record<string, unknown>).set) return (gs as Record<string, (...args: unknown[]) => unknown>).set(key, value); _localState[key] = value; return { ok: true, local: true }; }

function subscribe(key: string, handler: (...args: unknown[]) => void) { _metrics.subscribes++; const gs = _getPort('globalState'); if (gs && gs.subscribe) return gs.subscribe(key, handler); return () => {}; }

function getAll() { const gs = _getPort('globalState'); if (gs && gs.getAll) return gs.getAll(); return Object.assign({}, _localState); }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
function healthCheck() { const hasGlobalState = !!_getPort('globalState'); return { status: hasGlobalState ? 'HEALTHY' : 'DEGRADED', score: hasGlobalState ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { hasGlobalState: { ok: hasGlobalState, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, hasGlobalState: !!_getPort('globalState'), localStateKeys: Object.keys(_localState).length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export function createStateAdapter(options: Record<string, unknown>) { options = options || {}; init(options); return { get, set, subscribe, getAll, healthCheck, info, VERSION, MODULE_ID }; }

export { MODULE_ID, VERSION, init, get, set, subscribe, getAll, healthCheck, info };
export default { MODULE_ID, VERSION, createStateAdapter, init, get, set, subscribe, getAll, healthCheck, info, injectPorts, getPorts };
