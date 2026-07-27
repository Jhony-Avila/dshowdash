import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "nav-rail.core.lifecycle";
const VERSION = "5.1.0-ES6";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _log = (level, msg, data) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.call(logger, `[${MODULE_ID}]`, msg, data || "");
};
const hasWindow = typeof window !== "undefined";
const NavRailLifecycle = {
  _state: "idle",
  _mountedAt: null,
  STATES: { IDLE: "idle", INITIALIZING: "initializing", MOUNTED: "mounted", READY: "ready", DESTROYED: "destroyed", ERROR: "error" },
  setState(newState) {
    const prevState = this._state;
    this._state = newState;
    if (hasWindow && window.NavRailTracker && window.NavRailTracker.track) {
      window.NavRailTracker.track("lifecycle:change", { from: prevState, to: newState });
    }
  },
  getState() {
    return this._state;
  },
  isReady() {
    return this._state === this.STATES.READY;
  },
  markMounted() {
    this._mountedAt = Date.now();
    this.setState(this.STATES.MOUNTED);
  },
  markReady() {
    this.setState(this.STATES.READY);
  },
  markDestroyed() {
    this.setState(this.STATES.DESTROYED);
    this._mountedAt = null;
  },
  markError(error) {
    this.setState(this.STATES.ERROR);
    _log("error", "Lifecycle error", { error: error instanceof Error ? error.message : error });
  },
  getUptime() {
    if (!this._mountedAt) return 0;
    return Date.now() - this._mountedAt;
  },
  info() {
    return { state: this._state, mountedAt: this._mountedAt, uptime: this.getUptime(), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  },
  healthCheck() {
    const logger = _getPort("logger");
    return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { loggerAvailable: !!logger } };
  }
};
var lifecycle_default = NavRailLifecycle;
export {
  MODULE_ID,
  NavRailLifecycle,
  VERSION,
  lifecycle_default as default,
  getPorts,
  injectPorts
};
