// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01.core.states
// PURPOSE: Panel-01 State Machine
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   STATES — exported value
//   TRANSITIONS — exported value
//   info() — exported function
//   healthCheck() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01.core.states';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null; if (!logger) return; const prefix = '[StateMachine]'; if (level === 'error') logger.error?.(prefix, ...args); else if (level === 'info') logger.info?.(prefix, ...args); else logger.debug?.(prefix, ...args); };

export const STATES = Object.freeze({ IDLE: 'IDLE', MOUNTING: 'MOUNTING', MOUNTED: 'MOUNTED', LOADING: 'LOADING', LOADED: 'LOADED', READY: 'READY', ERROR: 'ERROR', DEGRADED: 'DEGRADED', REFRESHING: 'REFRESHING', UNMOUNTING: 'UNMOUNTING', DESTROYED: 'DESTROYED' });

export const TRANSITIONS = { [STATES.IDLE]: [STATES.MOUNTING, STATES.LOADING], [STATES.MOUNTING]: [STATES.MOUNTED, STATES.READY, STATES.ERROR], [STATES.MOUNTED]: [STATES.LOADING, STATES.READY, STATES.ERROR], [STATES.LOADING]: [STATES.LOADED, STATES.READY, STATES.ERROR], [STATES.LOADED]: [STATES.REFRESHING, STATES.LOADING, STATES.READY, STATES.UNMOUNTING], [STATES.READY]: [STATES.LOADING, STATES.REFRESHING, STATES.ERROR, STATES.UNMOUNTING], [STATES.ERROR]: [STATES.LOADING, STATES.MOUNTING, STATES.IDLE, STATES.UNMOUNTING], [STATES.DEGRADED]: [STATES.LOADING, STATES.READY, STATES.ERROR, STATES.UNMOUNTING], [STATES.REFRESHING]: [STATES.LOADED, STATES.READY, STATES.ERROR], [STATES.UNMOUNTING]: [STATES.DESTROYED, STATES.IDLE], [STATES.DESTROYED]: [STATES.IDLE] };

export class StateMachine {
  [key: string]: any;
  constructor(initialState = STATES.IDLE) { this.state = initialState; this.listeners = new Set(); }
  transition(newState: string) { if (!newState) { _log('info', 'Invalid transition: undefined state'); return false; } const allowed = (TRANSITIONS as Record<string, string[]>)[this.state] || []; if (!allowed.includes(newState)) { _log('info', 'Invalid transition:', this.state, '->', newState); return false; } const prevState = this.state; this.state = newState; this._notify(prevState, newState); return true; }
  is(state: string) { return this.state === state; }
  isLoading() { return this.state === STATES.LOADING || this.state === STATES.REFRESHING; }
  isError() { return this.state === STATES.ERROR; }
  isReady() { return this.state === STATES.LOADED || this.state === STATES.READY; }
  isMounting() { return this.state === STATES.MOUNTING; }
  isDegraded() { return this.state === STATES.DEGRADED; }
  subscribe(fn: (next: string, prev: string) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  _notify(prev: string, next: string) { this.listeners.forEach((fn: (next: string, prev: string) => void) => fn(next, prev)); }
  reset() { this.state = STATES.IDLE; }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export default { STATES, TRANSITIONS, StateMachine, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
