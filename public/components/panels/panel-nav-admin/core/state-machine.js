import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE1";
const MODULE_ID = "panel-nav-admin.core.state-machine";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[StateMachine]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "warn") logger.warn?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const STATES = Object.freeze({
  IDLE: "IDLE",
  MOUNTING: "MOUNTING",
  MOUNTED: "MOUNTED",
  LOADING: "LOADING",
  READY: "READY",
  SAVING: "SAVING",
  REFRESHING: "REFRESHING",
  ERROR: "ERROR",
  DEGRADED: "DEGRADED",
  UNMOUNTING: "UNMOUNTING",
  DESTROYED: "DESTROYED"
});
const TRANSITIONS = Object.freeze({
  [STATES.IDLE]: [STATES.MOUNTING, STATES.LOADING],
  [STATES.MOUNTING]: [STATES.MOUNTED, STATES.READY, STATES.ERROR],
  [STATES.MOUNTED]: [STATES.LOADING, STATES.READY, STATES.ERROR],
  [STATES.LOADING]: [STATES.READY, STATES.ERROR, STATES.DEGRADED],
  [STATES.READY]: [STATES.LOADING, STATES.SAVING, STATES.REFRESHING, STATES.ERROR, STATES.DEGRADED, STATES.UNMOUNTING],
  [STATES.SAVING]: [STATES.READY, STATES.ERROR, STATES.DEGRADED],
  [STATES.REFRESHING]: [STATES.READY, STATES.ERROR, STATES.DEGRADED],
  [STATES.ERROR]: [STATES.LOADING, STATES.MOUNTING, STATES.IDLE, STATES.UNMOUNTING],
  [STATES.DEGRADED]: [STATES.LOADING, STATES.READY, STATES.ERROR, STATES.UNMOUNTING],
  [STATES.UNMOUNTING]: [STATES.DESTROYED, STATES.IDLE],
  [STATES.DESTROYED]: [STATES.IDLE]
});
class StateMachine {
  /**
   * @param {string} [initialState=STATES.IDLE] — Starting state
   */
  constructor(initialState = STATES.IDLE) {
    this._state = initialState;
    this._listeners = /* @__PURE__ */ new Set();
    this._history = [];
    this._maxHistory = 50;
  }
  /**
   * Attempt to transition to a new state.
   * @param {string} newState — Target state from STATES enum
   * @returns {boolean} Whether the transition was accepted
   */
  transition(newState) {
    if (!newState) {
      _log("warn", "Invalid transition: undefined state");
      return false;
    }
    const allowed = TRANSITIONS[this._state];
    if (!allowed || !allowed.includes(newState)) {
      _log(
        "info",
        "Invalid transition:",
        this._state,
        "\u2192",
        newState,
        "| Allowed:",
        allowed ? allowed.join(", ") : "none"
      );
      return false;
    }
    const prevState = this._state;
    this._state = newState;
    this._history.push({ from: prevState, to: newState, at: Date.now() });
    if (this._history.length > this._maxHistory) {
      this._history = this._history.slice(-this._maxHistory);
    }
    _log("debug", "Transition:", prevState, "\u2192", newState);
    this._notify(prevState, newState);
    return true;
  }
  /**
   * Force-set state without transition validation (emergency use only).
   * @param {string} state
   */
  forceState(state) {
    const prev = this._state;
    this._state = state;
    this._history.push({ from: prev, to: state, at: Date.now(), forced: true });
    _log("warn", "Forced state:", prev, "\u2192", state);
    this._notify(prev, state);
  }
  /** @returns {string} Current state */
  current() {
    return this._state;
  }
  /**
   * Check if current state matches.
   * @param {string} state
   * @returns {boolean}
   */
  is(state) {
    return this._state === state;
  }
  /** @returns {boolean} Whether in LOADING or REFRESHING state */
  isLoading() {
    return this._state === STATES.LOADING || this._state === STATES.REFRESHING;
  }
  /** @returns {boolean} Whether in ERROR state */
  isError() {
    return this._state === STATES.ERROR;
  }
  /** @returns {boolean} Whether in READY state */
  isReady() {
    return this._state === STATES.READY;
  }
  /** @returns {boolean} Whether in MOUNTING state */
  isMounting() {
    return this._state === STATES.MOUNTING;
  }
  /** @returns {boolean} Whether in SAVING state */
  isSaving() {
    return this._state === STATES.SAVING;
  }
  /** @returns {boolean} Whether in DEGRADED state */
  isDegraded() {
    return this._state === STATES.DEGRADED;
  }
  /** @returns {boolean} Whether in DESTROYED state */
  isDestroyed() {
    return this._state === STATES.DESTROYED;
  }
  /**
   * Check whether a transition to newState is currently allowed.
   * @param {string} newState
   * @returns {boolean}
   */
  canTransitionTo(newState) {
    const allowed = TRANSITIONS[this._state];
    return !!allowed && allowed.includes(newState);
  }
  /**
   * Subscribe to state changes.
   * @param {Function} fn — Called with (newState, prevState) on every transition
   * @returns {Function} Unsubscribe function
   */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
  /**
   * @private Notify all subscribers of a state change.
   * @param {string} prev
   * @param {string} next
   */
  _notify(prev, next) {
    this._listeners.forEach((fn) => {
      try {
        fn(next, prev);
      } catch (e) {
        _log("error", "Subscriber error:", e.message);
      }
    });
  }
  /** @returns {Array<Object>} Transition history (last N entries) */
  getHistory() {
    return this._history.slice();
  }
  /** Reset state to IDLE and clear history. */
  reset() {
    this._state = STATES.IDLE;
    this._history = [];
  }
  /** Cleanup — remove all listeners and reset. */
  destroy() {
    this._listeners.clear();
    this._history = [];
    this._state = STATES.DESTROYED;
  }
}
function createStateMachine(initialState = STATES.IDLE) {
  return new StateMachine(initialState);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    statesCount: Object.keys(STATES).length,
    transitionsCount: Object.keys(TRANSITIONS).length,
    portsInitialized: Ports.isInitialized()
  };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized()
  };
}
var state_machine_default = { STATES, TRANSITIONS, StateMachine, createStateMachine, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  STATES,
  StateMachine,
  TRANSITIONS,
  VERSION,
  createStateMachine,
  state_machine_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
