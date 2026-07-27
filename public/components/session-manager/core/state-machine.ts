// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-lifecycle:state-machine
// PURPOSE: Session Manager - State Machine
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log, getPort from ../ports.js
//   SESSION_EVENTS from /core/runtime/events/index.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LIFECYCLE_STATES — exported value
//   lifecycleState — exported value
//   stateMetrics — exported value
//   transitionTo() — exported function
//   markDegraded() — exported function
//   markFailed() — exported function
//   markReady() — exported function
//   isInitialized() — exported function
//   getState() — exported function
//   getLifecycleInfo() — exported function
//   resetState() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   SESSION_EVENTS.LIFECYCLE_STATE_CHANGED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Core
//   window.SessionManager
// ═══════════════════════════════════════════════════════════════
'use strict';

import { log, getPort } from '../ports.js';
import { SESSION_EVENTS } from '/core/runtime/events/catalog/session.events.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'session-lifecycle:state-machine';

/**
 * Resolve tracker via Core.windowAdapter
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {Object}
 */
function getTracker() {
  if (typeof window === 'undefined') return { track() {} };
  const strictMode = isStrict();

  // Primary: Core.windowAdapter
  if ((window as any).Core && (window as any).Core.windowAdapter && (window as any).Core.windowAdapter.get) {
    const sm = (window as any).Core.windowAdapter.get('SessionManager');
    if (sm && sm.debug && sm.debug.tracker) {
      return sm.debug.tracker;
    }
  }

  // Em modo strict, não usa fallback
  if (strictMode) return { track() {} };

  // Fallback: window.SessionManager (legacy)
  if ((window as any).SessionManager && (window as any).SessionManager.debug && (window as any).SessionManager.debug.tracker) {
    recordViolation('WINDOW_SESSIONMANAGER_FALLBACK', { module: MODULE_ID, method: 'getTracker' });
    return (window as any).SessionManager.debug.tracker;
  }
  return { track() {} };
}

export const LIFECYCLE_STATES = Object.freeze({
  IDLE: 'IDLE',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  DEGRADED: 'DEGRADED',
  FAILED: 'FAILED',
  RECOVERING: 'RECOVERING',
  SHUTDOWN: 'SHUTDOWN'
});

export const lifecycleState: {
  state: string;
  previousState: string | null;
  initCount: number;
  lastInitAt: number | null;
  lastError: string | null;
  lastStateChange: number | null;
  config: unknown;
  degradedReasons: string[];
  failedReason: string | null;
} = {
  state: LIFECYCLE_STATES.IDLE as string,
  previousState: null,
  initCount: 0,
  lastInitAt: null,
  lastError: null,
  lastStateChange: null,
  config: null,
  degradedReasons: [],
  failedReason: null
};

export const stateMetrics = { stateTransitions: 0 };

export function transitionTo(newState: string, reason?: string) {
  const oldState = lifecycleState.state;
  if (oldState === newState) return false;
  lifecycleState.previousState = oldState;
  lifecycleState.state = newState;
  lifecycleState.lastStateChange = Date.now();
  stateMetrics.stateTransitions++;
  if (newState === LIFECYCLE_STATES.DEGRADED && reason) {
    if (lifecycleState.degradedReasons.indexOf(reason) === -1) {
      lifecycleState.degradedReasons.push(reason);
    }
  }
  // @ts-expect-error strict migration — TS2322
  if (newState === LIFECYCLE_STATES.FAILED) { lifecycleState.failedReason = reason; }
  if (newState === LIFECYCLE_STATES.READY) { lifecycleState.degradedReasons = []; lifecycleState.failedReason = null; }
  log.info('Lifecycle state transition', { from: oldState, to: newState, reason });
  const tracker = getTracker();
  if (tracker.track) tracker.track('session:lifecycle:state-change', { from: oldState, to: newState, reason });
  const eventBus = getPort('eventBus');
  if (eventBus && eventBus.emit) {
    eventBus.emit(SESSION_EVENTS.LIFECYCLE_STATE_CHANGED, { oldState, newState, reason, timestamp: Date.now() });
  }
  return true;
}

export function markDegraded(reason: string) {
  if (lifecycleState.state === LIFECYCLE_STATES.FAILED) return false;
  transitionTo(LIFECYCLE_STATES.DEGRADED, reason);
  return true;
}

export function markFailed(reason: string) { transitionTo(LIFECYCLE_STATES.FAILED, reason); return true; }

export function markReady() {
  lifecycleState.degradedReasons = [];
  lifecycleState.failedReason = null;
  transitionTo(LIFECYCLE_STATES.READY);
  return true;
}

export function isInitialized() {
  return lifecycleState.state === LIFECYCLE_STATES.READY || lifecycleState.state === LIFECYCLE_STATES.DEGRADED;
}

export function getState() { return lifecycleState.state; }

export function getLifecycleInfo() {
  return { state: lifecycleState.state, previousState: lifecycleState.previousState, initialized: isInitialized(), initCount: lifecycleState.initCount, lastInitAt: lifecycleState.lastInitAt, lastError: lifecycleState.lastError, lastStateChange: lifecycleState.lastStateChange, config: lifecycleState.config, degradedReasons: lifecycleState.degradedReasons.slice(), failedReason: lifecycleState.failedReason, authEventsIntegrated: true };
}

export function resetState() {
  lifecycleState.degradedReasons = [];
  lifecycleState.failedReason = null;
  transitionTo(LIFECYCLE_STATES.IDLE);
}

export function healthCheck() {
  const state = lifecycleState.state;
  const strictMode = isStrict();
  const checks = {
    statesConfigured: Object.keys(LIFECYCLE_STATES).length > 0,
    currentStateValid: Object.values(LIFECYCLE_STATES).indexOf(state as any) !== -1,
    notFailed: state !== LIFECYCLE_STATES.FAILED
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = state === LIFECYCLE_STATES.FAILED ? 'UNHEALTHY' : (state === LIFECYCLE_STATES.DEGRADED ? 'DEGRADED' : (passed === total ? 'HEALTHY' : 'DEGRADED'));
  return { status, moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, currentState: state, stateTransitions: stateMetrics.stateTransitions, strictMode, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, state: lifecycleState.state, stateTransitions: stateMetrics.stateTransitions, p25Compliant: true }; }

export default { LIFECYCLE_STATES, lifecycleState, transitionTo, markDegraded, markFailed, markReady, isInitialized, getState, getLifecycleInfo, resetState, healthCheck, info };
