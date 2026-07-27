// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.adapters.eventbus
// PURPOSE: Main - EventBus Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createEventBusAdapter() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   on() — exported function
//   emit() — exported function
//   once() — exported function
//   cleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.main.adapters.eventbus';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _cleanups: Array<unknown> = [];
const _metrics = { subscribed: 0, emitted: 0 };

function on(event: string, handler: (...args: unknown[]) => void) { _metrics.subscribed++; const eb = _getPort('eventBus'); if (eb && (eb as Record<string, unknown>).on) { const cleanup = (eb as Record<string, (...args: unknown[]) => unknown>).on(event, handler); _cleanups.push(cleanup); return cleanup; } return () => {}; }

function emit(event: string, data: Record<string, unknown>) { _metrics.emitted++; const eb = _getPort('eventBus'); if (eb && (eb as Record<string, unknown>).emit) { (eb as Record<string, (...args: unknown[]) => unknown>).emit(event, Object.assign({ source: 'main-adapter' }, data || {})); return { ok: true }; } return { ok: false, reason: 'EventBus not available' }; }

function once(event: string, handler: (...args: unknown[]) => void) { let cleanup: unknown; const wrappedHandler = (data: unknown) => { if (cleanup && typeof cleanup === 'function') cleanup(); handler(data); }; cleanup = on(event, wrappedHandler); return cleanup; }

function cleanup() { for (let i = 0; i < _cleanups.length; i++) { try { if (typeof _cleanups[i] === 'function') (_cleanups[i] as () => void)(); } catch (e) { } } _cleanups = []; return { ok: true }; }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
function healthCheck() { const hasEventBus = !!_getPort('eventBus'); return { status: hasEventBus ? 'HEALTHY' : 'DEGRADED', score: hasEventBus ? 100 : 50, moduleId: MODULE_ID, version: VERSION, checks: { hasEventBus: { ok: hasEventBus, severity: 'crit' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, activeSubscriptions: _cleanups.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export function createEventBusAdapter(options: Record<string, unknown>) { options = options || {}; init(options); return { on, emit, once, cleanup, healthCheck, info, VERSION, MODULE_ID }; }

export { MODULE_ID, VERSION, init, on, emit, once, cleanup, healthCheck, info };
export default { MODULE_ID, VERSION, createEventBusAdapter, init, on, emit, once, cleanup, healthCheck, info, injectPorts, getPorts };
