import { log, getPort } from "../ports.js";
import { SESSION_EVENTS } from "/core/runtime/events/catalog/session.events.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "1.5.0-P2-ENTERPRISE";
const MODULE_ID = "session-lifecycle:state-machine";
function getTracker() {
  if (typeof window === "undefined") return { track() {
  } };
  const strictMode = isStrict();
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const sm = window.Core.windowAdapter.get("SessionManager");
    if (sm && sm.debug && sm.debug.tracker) {
      return sm.debug.tracker;
    }
  }
  if (strictMode) return { track() {
  } };
  if (window.SessionManager && window.SessionManager.debug && window.SessionManager.debug.tracker) {
    recordViolation("WINDOW_SESSIONMANAGER_FALLBACK", { module: MODULE_ID, method: "getTracker" });
    return window.SessionManager.debug.tracker;
  }
  return { track() {
  } };
}
const LIFECYCLE_STATES = Object.freeze({
  IDLE: "IDLE",
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  DEGRADED: "DEGRADED",
  FAILED: "FAILED",
  RECOVERING: "RECOVERING",
  SHUTDOWN: "SHUTDOWN"
});
const lifecycleState = {
  state: LIFECYCLE_STATES.IDLE,
  previousState: null,
  initCount: 0,
  lastInitAt: null,
  lastError: null,
  lastStateChange: null,
  config: null,
  degradedReasons: [],
  failedReason: null
};
const stateMetrics = { stateTransitions: 0 };
function transitionTo(newState, reason) {
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
  if (newState === LIFECYCLE_STATES.FAILED) {
    lifecycleState.failedReason = reason;
  }
  if (newState === LIFECYCLE_STATES.READY) {
    lifecycleState.degradedReasons = [];
    lifecycleState.failedReason = null;
  }
  log.info("Lifecycle state transition", { from: oldState, to: newState, reason });
  const tracker = getTracker();
  if (tracker.track) tracker.track("session:lifecycle:state-change", { from: oldState, to: newState, reason });
  const eventBus = getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(SESSION_EVENTS.LIFECYCLE_STATE_CHANGED, { oldState, newState, reason, timestamp: Date.now() });
  }
  return true;
}
function markDegraded(reason) {
  if (lifecycleState.state === LIFECYCLE_STATES.FAILED) return false;
  transitionTo(LIFECYCLE_STATES.DEGRADED, reason);
  return true;
}
function markFailed(reason) {
  transitionTo(LIFECYCLE_STATES.FAILED, reason);
  return true;
}
function markReady() {
  lifecycleState.degradedReasons = [];
  lifecycleState.failedReason = null;
  transitionTo(LIFECYCLE_STATES.READY);
  return true;
}
function isInitialized() {
  return lifecycleState.state === LIFECYCLE_STATES.READY || lifecycleState.state === LIFECYCLE_STATES.DEGRADED;
}
function getState() {
  return lifecycleState.state;
}
function getLifecycleInfo() {
  return { state: lifecycleState.state, previousState: lifecycleState.previousState, initialized: isInitialized(), initCount: lifecycleState.initCount, lastInitAt: lifecycleState.lastInitAt, lastError: lifecycleState.lastError, lastStateChange: lifecycleState.lastStateChange, config: lifecycleState.config, degradedReasons: lifecycleState.degradedReasons.slice(), failedReason: lifecycleState.failedReason, authEventsIntegrated: true };
}
function resetState() {
  lifecycleState.degradedReasons = [];
  lifecycleState.failedReason = null;
  transitionTo(LIFECYCLE_STATES.IDLE);
}
function healthCheck() {
  const state = lifecycleState.state;
  const strictMode = isStrict();
  const checks = {
    statesConfigured: Object.keys(LIFECYCLE_STATES).length > 0,
    currentStateValid: Object.values(LIFECYCLE_STATES).indexOf(state) !== -1,
    notFailed: state !== LIFECYCLE_STATES.FAILED
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = state === LIFECYCLE_STATES.FAILED ? "UNHEALTHY" : state === LIFECYCLE_STATES.DEGRADED ? "DEGRADED" : passed === total ? "HEALTHY" : "DEGRADED";
  return { status, moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, currentState: state, stateTransitions: stateMetrics.stateTransitions, strictMode, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, state: lifecycleState.state, stateTransitions: stateMetrics.stateTransitions, p25Compliant: true };
}
var state_machine_default = { LIFECYCLE_STATES, lifecycleState, transitionTo, markDegraded, markFailed, markReady, isInitialized, getState, getLifecycleInfo, resetState, healthCheck, info };
export {
  LIFECYCLE_STATES,
  MODULE_ID,
  VERSION,
  state_machine_default as default,
  getLifecycleInfo,
  getState,
  healthCheck,
  info,
  isInitialized,
  lifecycleState,
  markDegraded,
  markFailed,
  markReady,
  resetState,
  stateMetrics,
  transitionTo
};
