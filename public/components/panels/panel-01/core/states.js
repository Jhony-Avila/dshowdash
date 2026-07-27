import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01.core.states";
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
  else if (level === "info") logger.info?.(prefix, ...args);
  else logger.debug?.(prefix, ...args);
};
const STATES = Object.freeze({ IDLE: "IDLE", MOUNTING: "MOUNTING", MOUNTED: "MOUNTED", LOADING: "LOADING", LOADED: "LOADED", READY: "READY", ERROR: "ERROR", DEGRADED: "DEGRADED", REFRESHING: "REFRESHING", UNMOUNTING: "UNMOUNTING", DESTROYED: "DESTROYED" });
const TRANSITIONS = { [STATES.IDLE]: [STATES.MOUNTING, STATES.LOADING], [STATES.MOUNTING]: [STATES.MOUNTED, STATES.READY, STATES.ERROR], [STATES.MOUNTED]: [STATES.LOADING, STATES.READY, STATES.ERROR], [STATES.LOADING]: [STATES.LOADED, STATES.READY, STATES.ERROR], [STATES.LOADED]: [STATES.REFRESHING, STATES.LOADING, STATES.READY, STATES.UNMOUNTING], [STATES.READY]: [STATES.LOADING, STATES.REFRESHING, STATES.ERROR, STATES.UNMOUNTING], [STATES.ERROR]: [STATES.LOADING, STATES.MOUNTING, STATES.IDLE, STATES.UNMOUNTING], [STATES.DEGRADED]: [STATES.LOADING, STATES.READY, STATES.ERROR, STATES.UNMOUNTING], [STATES.REFRESHING]: [STATES.LOADED, STATES.READY, STATES.ERROR], [STATES.UNMOUNTING]: [STATES.DESTROYED, STATES.IDLE], [STATES.DESTROYED]: [STATES.IDLE] };
class StateMachine {
  constructor(initialState = STATES.IDLE) {
    this.state = initialState;
    this.listeners = /* @__PURE__ */ new Set();
  }
  transition(newState) {
    if (!newState) {
      _log("info", "Invalid transition: undefined state");
      return false;
    }
    const allowed = TRANSITIONS[this.state] || [];
    if (!allowed.includes(newState)) {
      _log("info", "Invalid transition:", this.state, "->", newState);
      return false;
    }
    const prevState = this.state;
    this.state = newState;
    this._notify(prevState, newState);
    return true;
  }
  is(state) {
    return this.state === state;
  }
  isLoading() {
    return this.state === STATES.LOADING || this.state === STATES.REFRESHING;
  }
  isError() {
    return this.state === STATES.ERROR;
  }
  isReady() {
    return this.state === STATES.LOADED || this.state === STATES.READY;
  }
  isMounting() {
    return this.state === STATES.MOUNTING;
  }
  isDegraded() {
    return this.state === STATES.DEGRADED;
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  _notify(prev, next) {
    this.listeners.forEach((fn) => fn(next, prev));
  }
  reset() {
    this.state = STATES.IDLE;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
var states_default = { STATES, TRANSITIONS, StateMachine, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  STATES,
  StateMachine,
  TRANSITIONS,
  VERSION,
  states_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
