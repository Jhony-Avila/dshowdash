// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-state-machine
// PURPOSE: Container StateMachine - Máquina de Estados
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//   STATE from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createStateMachine() — exported function
//   getState() — exported function
//   canTransition() — exported function
//   transition() — exported function
//   reset() — exported function
//   getMetrics() — exported function
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

import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';
import { STATE } from './constants.js';

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-state-machine';

const VALID_TRANSITIONS: Record<string, string[]> = {
  [STATE.IDLE]: [STATE.CREATING],
  [STATE.CREATING]: [STATE.READY, STATE.ERROR],
  [STATE.READY]: [STATE.ACTIVE, STATE.LOADING, STATE.COLLAPSED, STATE.DESTROYING, STATE.ERROR],
  [STATE.ACTIVE]: [STATE.INACTIVE, STATE.LOADING, STATE.COLLAPSED, STATE.DESTROYING, STATE.ERROR],
  [STATE.INACTIVE]: [STATE.ACTIVE, STATE.LOADING, STATE.DESTROYING, STATE.ERROR],
  [STATE.LOADING]: [STATE.READY, STATE.ACTIVE, STATE.ERROR],
  [STATE.COLLAPSED]: [STATE.READY, STATE.ACTIVE, STATE.DESTROYING, STATE.ERROR],
  [STATE.ERROR]: [STATE.READY, STATE.DESTROYING, STATE.IDLE],
  [STATE.DESTROYING]: [STATE.DESTROYED],
  [STATE.DESTROYED]: [],
  [STATE.DEGRADED]: [STATE.READY, STATE.ERROR]
};

interface StateMachineDeps {
  containers: Map<string, Record<string, unknown>>;
  eventsPort: { emit(event: string, data: Record<string, unknown>): void; [k: string]: unknown };
}

export function createStateMachine(deps: Record<string, unknown> = {}) {
  const { containers, eventsPort } = deps as unknown as StateMachineDeps;
  let _history: Record<string, unknown>[] = [];
  let _maxHistory = 100;
  let _metrics = { transitions: 0, invalidAttempts: 0, errors: 0 };

  function _emit(event: string, data: Record<string, unknown> = {}) { eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }
  
  return {
    canTransition(fromState: string, toState: string) { const validTargets = VALID_TRANSITIONS[fromState] || []; return validTargets.includes(toState); },
    
    transition(containerId: string, toState: string, reason = '') {
      const container = containers?.get?.(containerId);
      if (!container) { _metrics.errors++; return false; }
      const fromState = container.state;
      // @ts-expect-error strict migration — TS2345
      if (!this.canTransition(fromState, toState)) { _metrics.invalidAttempts++; return false; }
      container.state = toState;
      container.lastTransition = { from: fromState, to: toState, reason, timestamp: Date.now() };
      _history.push({ containerId, from: fromState, to: toState, reason, timestamp: Date.now() });
      if (_history.length > _maxHistory) _history.shift();
      _metrics.transitions++;
      _emit(CONTAINER_EVENTS.STATE_CHANGED, { containerId, from: fromState, to: toState, reason });
      return true;
    },
    
    getState(containerId: string) { return (containers as Map<string, Record<string, unknown>>)?.get?.(containerId)?.state || null; },
    getHistory(limit: number = 50) { return _history.slice(-limit); },
    clearHistory() { _history = []; },
    getMetrics() { return { ..._metrics, historySize: _history.length }; },
    healthCheck() { return { status: _metrics.errors < 5 ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { historySize: _history.length, transitions: _metrics.transitions, invalidAttempts: _metrics.invalidAttempts, errors: _metrics.errors }, metrics: this.getMetrics() }; },
    info() { return { version: VERSION, moduleId: MODULE_ID, metrics: this.getMetrics(), validTransitions: VALID_TRANSITIONS }; }
  };
}

let _legacyState: string = STATE.IDLE;
export function getState() { return _legacyState; }
export function canTransition(to: string) { return (VALID_TRANSITIONS[_legacyState] || []).includes(to); }
export function transition(to: string) { if (canTransition(to)) { _legacyState = to; return true; } return false; }
export function reset() { _legacyState = STATE.IDLE; }
export function getMetrics() { return { currentState: _legacyState }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, currentState: _legacyState }; }

export default { createStateMachine, getState, canTransition, transition, reset, getMetrics, healthCheck, VERSION, MODULE_ID };
