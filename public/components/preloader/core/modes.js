import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "preloader-modes";
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
const log = { info(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, debug(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
const MODES = Object.freeze({ VIDEO: "video", STATIC: "static", MINIMAL: "minimal", DEGRADED: "degraded", NORMAL: "normal", FAST: "fast", RECOVERY: "recovery", KIOSK: "kiosk", DEBUG: "debug" });
const STATES = Object.freeze({ IDLE: "idle", INITIALIZING: "initializing", LOADING_VIDEO: "loading-video", WAITING_AUTH: "waiting-auth", LOADING_COMPONENTS: "loading-components", FINALIZING: "finalizing", HIDING: "hiding", COMPLETE: "complete", FAILED: "failed", DEGRADED: "degraded" });
const MODE_CONFIGS = {};
MODE_CONFIGS[MODES.VIDEO] = { showVideo: true, showLogo: true, showProgress: true, showPercentage: true, showText: true, animations: true };
MODE_CONFIGS[MODES.STATIC] = { showVideo: false, showLogo: true, showProgress: true, showPercentage: true, showText: true, animations: true };
MODE_CONFIGS[MODES.MINIMAL] = { showVideo: false, showLogo: true, showProgress: true, showPercentage: false, showText: false, animations: false };
MODE_CONFIGS[MODES.DEGRADED] = { showVideo: false, showLogo: true, showProgress: true, showPercentage: true, showText: true, showDegradedMessage: true, animations: false };
function PreloaderModeManager() {
  this.visualMode = MODES.VIDEO;
  this.functionalMode = MODES.NORMAL;
  this.state = STATES.IDLE;
  this._history = [];
  this._maxHistory = 50;
  this._listeners = /* @__PURE__ */ new Set();
  _initPorts();
}
PreloaderModeManager.prototype.getVisualMode = function() {
  return this.visualMode;
};
PreloaderModeManager.prototype.getFunctionalMode = function() {
  return this.functionalMode;
};
PreloaderModeManager.prototype.getState = function() {
  return this.state;
};
PreloaderModeManager.prototype.getConfig = function() {
  return MODE_CONFIGS[this.visualMode] || MODE_CONFIGS[MODES.VIDEO];
};
PreloaderModeManager.prototype.setVisualMode = function(mode) {
  const validModes = Object.values(MODES);
  if (validModes.indexOf(mode) === -1) {
    log.debug("Invalid visual mode", { mode });
    return false;
  }
  const prev = this.visualMode;
  this.visualMode = mode;
  this._recordHistory("visualMode", prev, mode);
  this._notifyListeners("visualMode", mode);
  log.info("Visual mode changed", { from: prev, to: mode });
  return true;
};
PreloaderModeManager.prototype.setFunctionalMode = function(mode) {
  const validModes = Object.values(MODES);
  if (validModes.indexOf(mode) === -1) {
    log.debug("Invalid functional mode", { mode });
    return false;
  }
  const prev = this.functionalMode;
  this.functionalMode = mode;
  this._recordHistory("functionalMode", prev, mode);
  this._notifyListeners("functionalMode", mode);
  log.info("Functional mode changed", { from: prev, to: mode });
  return true;
};
PreloaderModeManager.prototype.setState = function(state) {
  const validStates = Object.values(STATES);
  if (validStates.indexOf(state) === -1) {
    log.debug("Invalid state", { state });
    return false;
  }
  const prev = this.state;
  this.state = state;
  this._recordHistory("state", prev, state);
  this._notifyListeners("state", state);
  log.debug("State changed", { from: prev, to: state });
  return true;
};
PreloaderModeManager.prototype.setDegraded = function() {
  this.setVisualMode(MODES.DEGRADED);
  this.setState(STATES.DEGRADED);
};
PreloaderModeManager.prototype.setRecovery = function() {
  this.setFunctionalMode(MODES.RECOVERY);
  this.setVisualMode(MODES.MINIMAL);
};
PreloaderModeManager.prototype.setFailed = function() {
  this.setState(STATES.FAILED);
};
PreloaderModeManager.prototype.setComplete = function() {
  this.setState(STATES.COMPLETE);
};
PreloaderModeManager.prototype.isDegraded = function() {
  return this.visualMode === MODES.DEGRADED || this.state === STATES.DEGRADED;
};
PreloaderModeManager.prototype.isComplete = function() {
  return this.state === STATES.COMPLETE;
};
PreloaderModeManager.prototype.isFailed = function() {
  return this.state === STATES.FAILED;
};
PreloaderModeManager.prototype.isRecovery = function() {
  return this.functionalMode === MODES.RECOVERY;
};
PreloaderModeManager.prototype.subscribe = function(callback) {
  const self = this;
  this._listeners.add(callback);
  return () => {
    self._listeners.delete(callback);
  };
};
PreloaderModeManager.prototype._notifyListeners = function(type, value) {
  this._listeners.forEach((listener) => {
    try {
      listener({ type, value, timestamp: Date.now() });
    } catch (e) {
    }
  });
};
PreloaderModeManager.prototype._recordHistory = function(type, from, to) {
  this._history.push({ type, from, to, timestamp: Date.now() });
  if (this._history.length > this._maxHistory) {
    this._history.shift();
  }
};
PreloaderModeManager.prototype.getHistory = function() {
  return this._history.slice();
};
PreloaderModeManager.prototype.reset = function() {
  this.visualMode = MODES.VIDEO;
  this.functionalMode = MODES.NORMAL;
  this.state = STATES.IDLE;
  this._history = [];
};
PreloaderModeManager.prototype.getStatus = function() {
  return { version: VERSION, moduleId: MODULE_ID, visualMode: this.visualMode, functionalMode: this.functionalMode, state: this.state, config: this.getConfig(), historyLength: this._history.length, portsInitialized: Ports.isInitialized() };
};
PreloaderModeManager.prototype.healthCheck = function() {
  const validModes = Object.values(MODES);
  const validStates = Object.values(STATES);
  const validVisualMode = validModes.indexOf(this.visualMode) !== -1;
  const validFunctionalMode = validModes.indexOf(this.functionalMode) !== -1;
  const validState = validStates.indexOf(this.state) !== -1;
  const logger = _getPort("logger");
  const checks = { validVisualMode, validFunctionalMode, validState, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/5`, moduleId: MODULE_ID, version: VERSION, checks, currentModes: { visual: this.visualMode, functional: this.functionalMode, state: this.state }, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
PreloaderModeManager.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, availableModes: Object.values(MODES), availableStates: Object.values(STATES), status: this.getStatus(), portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
function createModeManager() {
  return new PreloaderModeManager();
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { modesDefinidos: Object.keys(MODES).length > 0, statesDefinidos: Object.keys(STATES).length > 0, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, moduleId: MODULE_ID, version: VERSION, checks, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, modes: Object.values(MODES), states: Object.values(STATES), modeConfigs: Object.keys(MODE_CONFIGS), portsInitialized: Ports.isInitialized() };
}
var modes_default = { VERSION, MODULE_ID, MODES, STATES, MODE_CONFIGS, PreloaderModeManager, createModeManager, healthCheck, info, injectPorts, getPorts };
export {
  MODES,
  MODULE_ID,
  PreloaderModeManager,
  STATES,
  VERSION,
  createModeManager,
  modes_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
