import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
import { STATE } from "./constants.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-state-machine";
const VALID_TRANSITIONS = {
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
function createStateMachine(deps = {}) {
  const { containers, eventsPort } = deps;
  let _history = [];
  let _maxHistory = 100;
  let _metrics = { transitions: 0, invalidAttempts: 0, errors: 0 };
  function _emit(event, data = {}) {
    eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  return {
    canTransition(fromState, toState) {
      const validTargets = VALID_TRANSITIONS[fromState] || [];
      return validTargets.includes(toState);
    },
    transition(containerId, toState, reason = "") {
      const container = containers?.get?.(containerId);
      if (!container) {
        _metrics.errors++;
        return false;
      }
      const fromState = container.state;
      if (!this.canTransition(fromState, toState)) {
        _metrics.invalidAttempts++;
        return false;
      }
      container.state = toState;
      container.lastTransition = { from: fromState, to: toState, reason, timestamp: Date.now() };
      _history.push({ containerId, from: fromState, to: toState, reason, timestamp: Date.now() });
      if (_history.length > _maxHistory) _history.shift();
      _metrics.transitions++;
      _emit(CONTAINER_EVENTS.STATE_CHANGED, { containerId, from: fromState, to: toState, reason });
      return true;
    },
    getState(containerId) {
      return containers?.get?.(containerId)?.state || null;
    },
    getHistory(limit = 50) {
      return _history.slice(-limit);
    },
    clearHistory() {
      _history = [];
    },
    getMetrics() {
      return { ..._metrics, historySize: _history.length };
    },
    healthCheck() {
      return { status: _metrics.errors < 5 ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { historySize: _history.length, transitions: _metrics.transitions, invalidAttempts: _metrics.invalidAttempts, errors: _metrics.errors }, metrics: this.getMetrics() };
    },
    info() {
      return { version: VERSION, moduleId: MODULE_ID, metrics: this.getMetrics(), validTransitions: VALID_TRANSITIONS };
    }
  };
}
let _legacyState = STATE.IDLE;
function getState() {
  return _legacyState;
}
function canTransition(to) {
  return (VALID_TRANSITIONS[_legacyState] || []).includes(to);
}
function transition(to) {
  if (canTransition(to)) {
    _legacyState = to;
    return true;
  }
  return false;
}
function reset() {
  _legacyState = STATE.IDLE;
}
function getMetrics() {
  return { currentState: _legacyState };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, currentState: _legacyState };
}
var state_machine_default = { createStateMachine, getState, canTransition, transition, reset, getMetrics, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  canTransition,
  createStateMachine,
  state_machine_default as default,
  getMetrics,
  getState,
  healthCheck,
  reset,
  transition
};
