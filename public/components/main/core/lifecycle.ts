// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.core.lifecycle
// PURPOSE: Main - Core Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   destroyMain() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   PHASES — exported value
//   init() — exported function
//   ready() — exported function
//   destroy() — exported function
//   setPhase() — exported function
//   getPhase() — exported function
//   isReady() — exported function
//   getBootTime() — exported function
//   registerCleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import type { MainState, CircuitBreaker, InitContext } from '../types.js';
import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.main.core.lifecycle';
const VERSION = '2.3.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const PHASES = { IDLE: 'idle', INITIALIZING: 'initializing', READY: 'ready', LOADING: 'loading', ERROR: 'error', DESTROYING: 'destroying' };
const _state: { initialized: boolean; phase: string; startTime: number | null; readyTime: number | null } = { initialized: false, phase: PHASES.IDLE, startTime: null, readyTime: null };
let _cleanups: Array<() => void> = [];
const _metrics = { inits: 0, destroys: 0, phaseChanges: 0 };

function _emit(eventName: string, data?: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }
function _track(eventName: string, payload?: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function setPhase(phase: string) { _metrics.phaseChanges++; const prev = _state.phase; _state.phase = phase; _emit(MAIN_EVENTS.LIFECYCLE_PHASE, { phase, previous: prev }); _track('main:lifecycle:phase', { phase }); if (phase === PHASES.READY && !_state.readyTime) _state.readyTime = Date.now(); return { ok: true, previous: prev, current: phase }; }

function getPhase() { return _state.phase; }
function isReady() { return _state.phase === PHASES.READY; }
function getBootTime() { if (_state.startTime && _state.readyTime) return _state.readyTime - _state.startTime; return null; }
function registerCleanup(fn: () => void) { if (typeof fn === 'function') _cleanups.push(fn); return () => { const idx = _cleanups.indexOf(fn); if (idx >= 0) _cleanups.splice(idx, 1); }; }

function init(ctx?: InitContext) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _metrics.inits++; _state.startTime = Date.now(); _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); setPhase(PHASES.INITIALIZING); _state.initialized = true; _track('main:lifecycle:init', { version: VERSION }); return { ok: true, version: VERSION }; }

function ready() { setPhase(PHASES.READY); _emit(MAIN_EVENTS.READY, { bootTime: getBootTime() }); return { ok: true, bootTime: getBootTime() }; }

function destroy() { _metrics.destroys++; setPhase(PHASES.DESTROYING); for (let i = _cleanups.length - 1; i >= 0; i--) { try { _cleanups[i](); } catch (e) { } } _cleanups = []; _state.initialized = false; _state.phase = PHASES.IDLE; return { ok: true }; }

// destroyMain - wrapper for index.js compatibility (receives state and circuitBreaker context)
export function destroyMain(state: MainState, circuitBreaker: CircuitBreaker) {
  destroy();
  if (state) {
    state.initialized = false;
    state.mounted = false;
  }
  return { ok: true };
}

function healthCheck() { let score = _state.initialized ? 100 : 50; if (_state.phase === PHASES.ERROR) score -= 30; return { status: score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY', score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'crit' }, isReady: { ok: isReady(), severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, phase: _state.phase, bootTime: getBootTime(), cleanupsCount: _cleanups.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, PHASES, init, ready, destroy, setPhase, getPhase, isReady, getBootTime, registerCleanup, healthCheck, info };
export default { MODULE_ID, VERSION, PHASES, init, ready, destroy, destroyMain, setPhase, getPhase, isReady, getBootTime, registerCleanup, healthCheck, info, injectPorts, getPorts };
