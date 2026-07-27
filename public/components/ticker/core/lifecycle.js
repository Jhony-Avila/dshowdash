import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.5.0-P2-ENTERPRISE";
const MODULE_ID = "ticker/core/lifecycle";
const hasWindow = typeof window !== "undefined";
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
const STATES = Object.freeze({ UNMOUNTED: "unmounted", MOUNTING: "mounting", MOUNTED: "mounted", READY: "ready", PAUSED: "paused", UNMOUNTING: "unmounting" });
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...extraArgs) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
function LifecycleManager(ticker) {
  this.ticker = ticker;
  this.state = STATES.UNMOUNTED;
  this._metrics = { mountCount: 0, unmountCount: 0, pauseCount: 0, resumeCount: 0, lastTransitionAt: null };
  _initPorts();
}
LifecycleManager.prototype.mount = function() {
  const self = this;
  if (this.state !== STATES.UNMOUNTED) {
    _log("warn", `Cannot mount from state: ${this.state}`);
    return Promise.resolve(false);
  }
  this._transition(STATES.MOUNTING);
  this._transition(STATES.MOUNTED);
  this._metrics.mountCount++;
  return Promise.resolve(true);
};
LifecycleManager.prototype.ready = function() {
  const self = this;
  if (this.state !== STATES.MOUNTED) {
    _log("warn", `Cannot ready from state: ${this.state}`);
    return Promise.resolve(false);
  }
  this._transition(STATES.READY);
  if (this.ticker && this.ticker.polling) {
    this.ticker.polling.start();
    _log("debug", "Polling started by lifecycle");
  }
  return Promise.resolve(true);
};
LifecycleManager.prototype.pause = function() {
  const self = this;
  if (this.state !== STATES.READY) {
    _log("warn", `Cannot pause from state: ${this.state}`);
    return Promise.resolve(false);
  }
  this._transition(STATES.PAUSED);
  if (this.ticker && this.ticker.polling) {
    this.ticker.polling.stop();
    _log("debug", "Polling stopped by lifecycle (pause)");
  }
  this._metrics.pauseCount++;
  return Promise.resolve(true);
};
LifecycleManager.prototype.resume = function() {
  const self = this;
  if (this.state !== STATES.PAUSED) {
    _log("warn", `Cannot resume from state: ${this.state}`);
    return Promise.resolve(false);
  }
  this._transition(STATES.READY);
  if (this.ticker && this.ticker.polling) {
    this.ticker.polling.start();
    _log("debug", "Polling restarted by lifecycle (resume)");
  }
  this._metrics.resumeCount++;
  return Promise.resolve(true);
};
LifecycleManager.prototype.unmount = function() {
  const self = this;
  if (this.state === STATES.UNMOUNTED) return Promise.resolve(false);
  this._transition(STATES.UNMOUNTING);
  if (this.ticker && this.ticker.polling) {
    this.ticker.polling.stop();
    this.ticker.polling.abort();
    _log("debug", "Polling stopped and aborted by lifecycle (unmount)");
  }
  this._transition(STATES.UNMOUNTED);
  this._metrics.unmountCount++;
  return Promise.resolve(true);
};
LifecycleManager.prototype._transition = function(newState) {
  const oldState = this.state;
  this.state = newState;
  this._metrics.lastTransitionAt = Date.now();
  _log("debug", `State: ${oldState} -> ${newState}`);
};
LifecycleManager.prototype.getState = function() {
  return this.state;
};
LifecycleManager.prototype.isReady = function() {
  return this.state === STATES.READY;
};
LifecycleManager.prototype.isMounted = function() {
  return this.state === STATES.MOUNTED || this.state === STATES.READY || this.state === STATES.PAUSED;
};
LifecycleManager.prototype.canFetch = function() {
  return this.state === STATES.READY;
};
LifecycleManager.prototype.healthCheck = function() {
  const logger = _getPort("logger");
  const stateKeys = Object.keys(STATES);
  const validStates = [];
  for (let i = 0; i < stateKeys.length; i++) {
    validStates.push(STATES[stateKeys[i]]);
  }
  const checks = {
    validState: validStates.indexOf(this.state) !== -1,
    hasComponent: !!this.ticker,
    loggerReady: !!logger,
    portsInitialized: Ports.isInitialized()
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let j = 0; j < checkKeys.length; j++) {
    if (checks[checkKeys[j]]) passed++;
  }
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 4, scoreDisplay: `${passed}/4`, checks, state: this.state, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
LifecycleManager.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, state: this.state, states: STATES, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
LifecycleManager.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
LifecycleManager.prototype.resetMetrics = function() {
  this._metrics = { mountCount: 0, unmountCount: 0, pauseCount: 0, resumeCount: 0, lastTransitionAt: null };
};
function getVersion() {
  return VERSION;
}
var lifecycle_default = LifecycleManager;
export {
  LifecycleManager,
  MODULE_ID,
  STATES,
  VERSION,
  lifecycle_default as default,
  getPorts,
  getVersion,
  injectPorts
};
