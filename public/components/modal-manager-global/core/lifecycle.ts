// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.core.lifecycle
// PURPOSE: Modal Manager Global - Core Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   PHASES — exported value
//   init() — exported function
//   cleanup() — exported function
//   open() — exported function
//   close() — exported function
//   setPhase() — exported function
//   getPhase() — exported function
//   registerCleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   global.core
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

const MODULE_ID = 'components.modal-manager-global.core.lifecycle';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const PHASES = { IDLE: 'idle', OPENING: 'opening', OPEN: 'open', CLOSING: 'closing' };
const _state = { initialized: false, phase: PHASES.IDLE };
let _cleanups: Array<() => void> = [];
const _metrics = { opens: 0, closes: 0 };

function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }

function setPhase(phase: string) { _state.phase = phase; _emit(UI_EVENTS.MODAL_LIFECYCLE_PHASE, { phase }); return { ok: true, phase }; }
function getPhase() { return _state.phase; }

function open(config: Record<string, unknown>) { _metrics.opens++; setPhase(PHASES.OPENING); _emit(UI_EVENTS.MODAL_OPENING, config); setTimeout(() => { setPhase(PHASES.OPEN); _emit(UI_EVENTS.MODAL_OPENED, config); }, 0); return { ok: true }; }

function close(id: string) { _metrics.closes++; setPhase(PHASES.CLOSING); _emit(UI_EVENTS.MODAL_CLOSING, { id }); setTimeout(() => { setPhase(PHASES.IDLE); _emit(UI_EVENTS.MODAL_CLOSED, { id }); }, 0); return { ok: true }; }

function registerCleanup(fn: () => void) { if (typeof fn === 'function') _cleanups.push(fn); return () => { const idx = _cleanups.indexOf(fn); if (idx >= 0) _cleanups.splice(idx, 1); }; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { for (let i = 0; i < _cleanups.length; i++) { try { _cleanups[i](); } catch (e) { } } _cleanups = []; _state.phase = PHASES.IDLE; _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, isIdle: { ok: _state.phase === PHASES.IDLE, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, phase: _state.phase, cleanupsCount: _cleanups.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, PHASES, init, cleanup, open, close, setPhase, getPhase, registerCleanup, healthCheck, info };
export default { MODULE_ID, VERSION, PHASES, init, cleanup, open, close, setPhase, getPhase, registerCleanup, healthCheck, info, injectPorts, getPorts };
