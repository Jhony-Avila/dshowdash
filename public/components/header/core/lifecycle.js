import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import { HEADER_EVENTS } from "/core/runtime/events/catalog/header.events.js";
const VERSION = "5.7.0-ES6";
const MODULE_ID = "header/core/lifecycle";
const LIFECYCLE_STATES = Object.freeze({ IDLE: "idle", MOUNTING: "mounting", MOUNTED: "mounted", READY: "ready", DEGRADED: "degraded", ERROR: "error", WARNING: "warning", UNMOUNTING: "unmounting", UNMOUNTED: "unmounted", DESTROYED: "destroyed" });
const TIMEOUTS = Object.freeze({ MOUNT: 1e4, READY: 5e3, UNMOUNT: 3e3, HOOK: 5e3 });
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const STATE_TO_EVENT = {};
STATE_TO_EVENT[LIFECYCLE_STATES.MOUNTING] = LIFECYCLE_EVENTS.MOUNTING;
STATE_TO_EVENT[LIFECYCLE_STATES.MOUNTED] = LIFECYCLE_EVENTS.MOUNTED;
STATE_TO_EVENT[LIFECYCLE_STATES.READY] = LIFECYCLE_EVENTS.READY;
STATE_TO_EVENT[LIFECYCLE_STATES.DEGRADED] = LIFECYCLE_EVENTS.DEGRADED;
STATE_TO_EVENT[LIFECYCLE_STATES.ERROR] = LIFECYCLE_EVENTS.ERROR;
STATE_TO_EVENT[LIFECYCLE_STATES.WARNING] = LIFECYCLE_EVENTS.WARNING;
STATE_TO_EVENT[LIFECYCLE_STATES.UNMOUNTING] = LIFECYCLE_EVENTS.UNMOUNTING;
STATE_TO_EVENT[LIFECYCLE_STATES.UNMOUNTED] = LIFECYCLE_EVENTS.UNMOUNTED;
STATE_TO_EVENT[LIFECYCLE_STATES.DESTROYED] = LIFECYCLE_EVENTS.DESTROYED;
function LifecycleManager(config) {
  config = config || {};
  this.config = { maxHistorySize: config.maxHistorySize || 50, transitionTimeout: config.transitionTimeout || TIMEOUTS.MOUNT, maxErrorCount: config.maxErrorCount || 5, maxDegradedCount: config.maxDegradedCount || 3, autoRecovery: config.autoRecovery !== false, autoRecoveryDelay: config.autoRecoveryDelay || 3e4, enableTelemetry: config.enableTelemetry !== false, instanceId: config.instanceId || "lifecycle-default" };
  this._debug = false;
  this._metrics = { transitionCount: 0, hookCount: 0, errorCount: 0, recoveryCount: 0, lastTransitionAt: null };
  this.eventBus = config.eventBus || null;
  this.currentState = LIFECYCLE_STATES.IDLE;
  this.previousState = null;
  this.isDestroyed = false;
  this.isTransitioning = false;
  this.stateHistory = [];
  this.hooks = { onMounting: [], onMounted: [], onReady: [], onDegraded: [], onRecovered: [], onError: [], onWarning: [], onUnmounting: [], onUnmounted: [], onDestroyed: [] };
  this.metadata = { mountedAt: null, readyAt: null, destroyedAt: null, errorCount: 0, degradedCount: 0, recoveryCount: 0, transitionCount: 0, lastTransitionAt: null, lastErrorAt: null, lastDegradedAt: null };
  this.circuitBreaker = { isOpen: false, failures: 0, lastFailureTime: null, resetTimeout: 3e4 };
  this.recoveryTimer = null;
  this._initAutoRecovery();
}
LifecycleManager.prototype._initAutoRecovery = function() {
  const self = this;
  if (!this.config.autoRecovery) return;
  this.recoveryTimer = setInterval(() => {
    if (self.isDestroyed) return;
    if (self.isDegraded() && self.metadata.degradedCount < self.config.maxDegradedCount) {
      const timeSinceDegraded = Date.now() - self.metadata.lastDegradedAt;
      if (timeSinceDegraded > self.config.autoRecoveryDelay) {
        _log("info", "Auto-recovery iniciado");
        self.recover({ auto: true });
      }
    }
    if (self.circuitBreaker.isOpen) {
      const timeSinceFailure = Date.now() - self.circuitBreaker.lastFailureTime;
      if (timeSinceFailure > self.circuitBreaker.resetTimeout) {
        self.circuitBreaker.isOpen = false;
        self.circuitBreaker.failures = 0;
        _log("info", "Circuit breaker resetado");
      }
    }
  }, 5e3);
};
LifecycleManager.prototype._validateState = (state) => {
  if (!state || typeof state !== "string") throw new TypeError("Estado deve ser uma string n\xE3o-vazia");
  const stateKeys = Object.keys(LIFECYCLE_STATES);
  const validStates = [];
  for (let i = 0; i < stateKeys.length; i++) validStates.push(LIFECYCLE_STATES[stateKeys[i]]);
  if (validStates.indexOf(state) === -1) throw new Error(`Estado inv\xE1lido: ${state}`);
  return true;
};
LifecycleManager.prototype.getState = function() {
  return this.currentState;
};
LifecycleManager.prototype.is = function(state) {
  this._validateState(state);
  return this.currentState === state;
};
LifecycleManager.prototype.isMounted = function() {
  return [LIFECYCLE_STATES.MOUNTED, LIFECYCLE_STATES.READY, LIFECYCLE_STATES.DEGRADED].indexOf(this.currentState) !== -1;
};
LifecycleManager.prototype.isReady = function() {
  return this.currentState === LIFECYCLE_STATES.READY;
};
LifecycleManager.prototype.isDegraded = function() {
  return this.currentState === LIFECYCLE_STATES.DEGRADED;
};
LifecycleManager.prototype.isError = function() {
  return this.currentState === LIFECYCLE_STATES.ERROR;
};
LifecycleManager.prototype.isDestroyedState = function() {
  return this.isDestroyed || this.currentState === LIFECYCLE_STATES.DESTROYED;
};
LifecycleManager.prototype.transition = function(newState, metadata) {
  const self = this;
  metadata = metadata || {};
  if (this.isDestroyed) {
    _log("warn", "Lifecycle destru\xEDdo - transi\xE7\xE3o ignorada");
    return Promise.resolve(false);
  }
  try {
    this._validateState(newState);
  } catch (error) {
    _log("error", "Estado inv\xE1lido:", error.message);
    return Promise.resolve(false);
  }
  if (this.currentState === newState) {
    _log("debug", `J\xE1 est\xE1 em estado: ${newState}`);
    return Promise.resolve(true);
  }
  if (this.isTransitioning) {
    _log("warn", "Transi\xE7\xE3o em andamento - aguarde");
    return Promise.resolve(false);
  }
  if (this.circuitBreaker.isOpen && newState === LIFECYCLE_STATES.ERROR) {
    _log("warn", "Circuit breaker aberto");
    return Promise.resolve(false);
  }
  if (!this._isValidTransition(this.currentState, newState)) {
    _log("error", `Transicao invalida: ${this.currentState} -> ${newState}`);
    return Promise.resolve(false);
  }
  this.isTransitioning = true;
  const transitionPromise = this._executeTransition(newState, metadata);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Timeout de transi\xE7\xE3o"));
    }, self.config.transitionTimeout);
  });
  return Promise.race([transitionPromise, timeoutPromise]).then(() => {
    self.isTransitioning = false;
    return true;
  }).catch((error) => {
    _log("error", "Erro na transi\xE7\xE3o:", error);
    self._handleTransitionError(error);
    self.isTransitioning = false;
    return false;
  });
};
LifecycleManager.prototype._executeTransition = function(newState, metadata) {
  const self = this;
  const oldState = this.currentState;
  const timestamp = Date.now();
  this.previousState = oldState;
  this.currentState = newState;
  this.metadata.transitionCount++;
  this.metadata.lastTransitionAt = timestamp;
  this._metrics.transitionCount++;
  this._metrics.lastTransitionAt = timestamp;
  this._updateMetadata(newState, timestamp);
  this._addToHistory({ from: oldState, to: newState, timestamp, metadata });
  _log("info", `Lifecycle: ${oldState} -> ${newState}`);
  if (this.eventBus) {
    try {
      const eventName = STATE_TO_EVENT[newState] || LIFECYCLE_EVENTS.PREFIX + newState;
      this.eventBus.emit(eventName, { previousState: oldState, currentState: newState, timestamp, metadata });
    } catch (error) {
      _log("error", "Erro ao emitir evento:", error);
    }
  }
  return this._executeHooks(newState, { oldState, newState, timestamp, metadata });
};
LifecycleManager.prototype._updateMetadata = function(state, timestamp) {
  switch (state) {
    case LIFECYCLE_STATES.MOUNTED:
      this.metadata.mountedAt = timestamp;
      break;
    case LIFECYCLE_STATES.READY:
      this.metadata.readyAt = timestamp;
      if (this.previousState === LIFECYCLE_STATES.DEGRADED) {
        this.metadata.recoveryCount++;
        this._metrics.recoveryCount++;
      }
      break;
    case LIFECYCLE_STATES.ERROR:
      this.metadata.errorCount++;
      this.metadata.lastErrorAt = timestamp;
      this._metrics.errorCount++;
      break;
    case LIFECYCLE_STATES.DEGRADED:
      this.metadata.degradedCount++;
      this.metadata.lastDegradedAt = timestamp;
      break;
    case LIFECYCLE_STATES.DESTROYED:
      this.metadata.destroyedAt = timestamp;
      this.isDestroyed = true;
      break;
  }
};
LifecycleManager.prototype._handleTransitionError = function(error) {
  this.circuitBreaker.failures++;
  this.circuitBreaker.lastFailureTime = Date.now();
  if (this.circuitBreaker.failures >= this.config.maxErrorCount) {
    this.circuitBreaker.isOpen = true;
    _log("error", "Circuit breaker ABERTO ap\xF3s m\xFAltiplas falhas");
  }
};
LifecycleManager.prototype._isValidTransition = (from, to) => {
  const validTransitions = {};
  validTransitions[LIFECYCLE_STATES.IDLE] = [LIFECYCLE_STATES.MOUNTING];
  validTransitions[LIFECYCLE_STATES.MOUNTING] = [LIFECYCLE_STATES.MOUNTED, LIFECYCLE_STATES.ERROR];
  validTransitions[LIFECYCLE_STATES.MOUNTED] = [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.DEGRADED, LIFECYCLE_STATES.ERROR, LIFECYCLE_STATES.UNMOUNTING];
  validTransitions[LIFECYCLE_STATES.READY] = [LIFECYCLE_STATES.DEGRADED, LIFECYCLE_STATES.ERROR, LIFECYCLE_STATES.UNMOUNTING];
  validTransitions[LIFECYCLE_STATES.DEGRADED] = [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.ERROR, LIFECYCLE_STATES.UNMOUNTING];
  validTransitions[LIFECYCLE_STATES.ERROR] = [LIFECYCLE_STATES.MOUNTING, LIFECYCLE_STATES.UNMOUNTING, LIFECYCLE_STATES.DEGRADED];
  validTransitions[LIFECYCLE_STATES.WARNING] = [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.DEGRADED, LIFECYCLE_STATES.ERROR];
  validTransitions[LIFECYCLE_STATES.UNMOUNTING] = [LIFECYCLE_STATES.UNMOUNTED];
  validTransitions[LIFECYCLE_STATES.UNMOUNTED] = [LIFECYCLE_STATES.MOUNTING, LIFECYCLE_STATES.DESTROYED];
  validTransitions[LIFECYCLE_STATES.DESTROYED] = [];
  const allowed = validTransitions[from];
  return allowed && allowed.indexOf(to) !== -1;
};
LifecycleManager.prototype._addToHistory = function(transition) {
  this.stateHistory.push(transition);
  if (this.stateHistory.length > this.config.maxHistorySize) this.stateHistory.shift();
};
LifecycleManager.prototype._executeHooks = function(state, context) {
  const self = this;
  const hookName = this._getHookName(state);
  if (!hookName) return Promise.resolve();
  const hooks = this.hooks[hookName] || [];
  let index = 0;
  function runNext() {
    if (index >= hooks.length) return Promise.resolve();
    const hook = hooks[index++];
    self._metrics.hookCount++;
    const hookPromise = Promise.resolve().then(() => hook(context));
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Hook timeout"));
      }, TIMEOUTS.HOOK);
    });
    return Promise.race([hookPromise, timeoutPromise]).catch((error) => {
      _log("error", `Erro em hook ${hookName}:`, error);
    }).then(runNext);
  }
  return runNext();
};
LifecycleManager.prototype._getHookName = (state) => {
  const hookMap = {};
  hookMap[LIFECYCLE_STATES.MOUNTING] = "onMounting";
  hookMap[LIFECYCLE_STATES.MOUNTED] = "onMounted";
  hookMap[LIFECYCLE_STATES.READY] = "onReady";
  hookMap[LIFECYCLE_STATES.DEGRADED] = "onDegraded";
  hookMap[LIFECYCLE_STATES.ERROR] = "onError";
  hookMap[LIFECYCLE_STATES.WARNING] = "onWarning";
  hookMap[LIFECYCLE_STATES.UNMOUNTING] = "onUnmounting";
  hookMap[LIFECYCLE_STATES.UNMOUNTED] = "onUnmounted";
  hookMap[LIFECYCLE_STATES.DESTROYED] = "onDestroyed";
  return hookMap[state] || null;
};
LifecycleManager.prototype.registerHook = function(hookName, callback) {
  if (!this.hooks[hookName]) {
    _log("warn", `Hook inv\xE1lido: ${hookName}`);
    return false;
  }
  if (typeof callback !== "function") {
    _log("error", "Hook callback deve ser fun\xE7\xE3o");
    return false;
  }
  if (this.hooks[hookName].indexOf(callback) !== -1) {
    _log("debug", `Hook j\xE1 registrado: ${hookName}`);
    return true;
  }
  this.hooks[hookName].push(callback);
  _log("debug", `Hook registrado: ${hookName}`);
  return true;
};
LifecycleManager.prototype.unregisterHook = function(hookName, callback) {
  if (!this.hooks[hookName]) return false;
  const index = this.hooks[hookName].indexOf(callback);
  if (index > -1) {
    this.hooks[hookName].splice(index, 1);
    return true;
  }
  return false;
};
LifecycleManager.prototype.mount = function(metadata) {
  const self = this;
  metadata = metadata || {};
  if (this.isMounted()) {
    _log("debug", "J\xE1 est\xE1 montado");
    return Promise.resolve(true);
  }
  return this.transition(LIFECYCLE_STATES.MOUNTING, metadata).then(() => self.transition(LIFECYCLE_STATES.MOUNTED, metadata)).then(() => true);
};
LifecycleManager.prototype.ready = function(metadata) {
  metadata = metadata || {};
  if (this.isReady()) {
    _log("debug", "J\xE1 est\xE1 pronto");
    return Promise.resolve(true);
  }
  return this.transition(LIFECYCLE_STATES.READY, metadata).then(() => true);
};
LifecycleManager.prototype.degrade = function(reason, metadata) {
  reason = reason || "unknown";
  metadata = metadata || {};
  return this.transition(LIFECYCLE_STATES.DEGRADED, Object.assign({ reason }, metadata)).then(() => true);
};
LifecycleManager.prototype.recover = function(metadata) {
  metadata = metadata || {};
  if (!this.isDegraded()) {
    _log("warn", "N\xE3o est\xE1 degradado - recovery ignorado");
    return Promise.resolve(false);
  }
  return this.transition(LIFECYCLE_STATES.READY, Object.assign({ recovered: true }, metadata)).then(() => true);
};
LifecycleManager.prototype.error = function(error, metadata) {
  metadata = metadata || {};
  const errorMsg = error && error.message ? error.message : error;
  const errorStack = error && error.stack ? error.stack : null;
  return this.transition(LIFECYCLE_STATES.ERROR, Object.assign({ error: errorMsg, stack: errorStack }, metadata)).then(() => true);
};
LifecycleManager.prototype.warning = function(message, metadata) {
  metadata = metadata || {};
  return this.transition(LIFECYCLE_STATES.WARNING, Object.assign({ message }, metadata)).then(() => true);
};
LifecycleManager.prototype.unmount = function(metadata) {
  const self = this;
  metadata = metadata || {};
  if (!this.isMounted()) {
    _log("debug", "N\xE3o est\xE1 montado");
    return Promise.resolve(true);
  }
  return this.transition(LIFECYCLE_STATES.UNMOUNTING, metadata).then(() => self.transition(LIFECYCLE_STATES.UNMOUNTED, metadata)).then(() => true);
};
LifecycleManager.prototype.destroy = function(metadata) {
  const self = this;
  metadata = metadata || {};
  if (this.isDestroyed) {
    _log("debug", "J\xE1 est\xE1 destru\xEDdo");
    return Promise.resolve(true);
  }
  const p = this.isMounted() ? this.unmount() : Promise.resolve();
  return p.then(() => self.transition(LIFECYCLE_STATES.DESTROYED, metadata)).then(() => {
    self._cleanup();
    return true;
  });
};
LifecycleManager.prototype._cleanup = function() {
  if (this.recoveryTimer) {
    clearInterval(this.recoveryTimer);
    this.recoveryTimer = null;
  }
  for (const key in this.hooks) this.hooks[key] = [];
  _log("info", "Lifecycle limpo");
};
LifecycleManager.prototype.getHistory = function(limit) {
  const history = this.stateHistory.slice();
  return limit ? history.slice(-limit) : history;
};
LifecycleManager.prototype.getMetrics = function() {
  const now = Date.now();
  return Object.assign({}, { currentState: this.currentState, previousState: this.previousState, isTransitioning: this.isTransitioning, isDestroyed: this.isDestroyed }, this.metadata, { uptime: this.metadata.mountedAt ? now - this.metadata.mountedAt : 0, timeToReady: this.metadata.readyAt && this.metadata.mountedAt ? this.metadata.readyAt - this.metadata.mountedAt : null, historySize: this.stateHistory.length, circuitBreakerStatus: this.circuitBreaker.isOpen ? "OPEN" : "CLOSED", circuitBreakerFailures: this.circuitBreaker.failures });
};
LifecycleManager.prototype.healthCheck = function() {
  const checks = { notDestroyed: !this.isDestroyed, notInError: !this.isError(), circuitBreakerClosed: !this.circuitBreaker.isOpen, isOperational: this.isMounted(), belowMaxErrors: this.metadata.errorCount < this.config.maxErrorCount };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) if (checks[checkKeys[i]]) passed++;
  const total = checkKeys.length;
  const issues = [];
  for (let j = 0; j < checkKeys.length; j++) if (!checks[checkKeys[j]]) issues.push(checkKeys[j]);
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, state: this.currentState, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
LifecycleManager.prototype.clearHistory = function() {
  this.stateHistory = [];
  _log("debug", "Hist\xF3rico limpo");
};
LifecycleManager.prototype.reset = function() {
  if (this.isDestroyed) {
    _log("warn", "N\xE3o pode resetar lifecycle destru\xEDdo");
    return false;
  }
  this.currentState = LIFECYCLE_STATES.IDLE;
  this.previousState = null;
  this.isTransitioning = false;
  this.stateHistory = [];
  this.metadata = { mountedAt: null, readyAt: null, destroyedAt: null, errorCount: 0, degradedCount: 0, recoveryCount: 0, transitionCount: 0, lastTransitionAt: null, lastErrorAt: null, lastDegradedAt: null };
  this.circuitBreaker = { isOpen: false, failures: 0, lastFailureTime: null, resetTimeout: 3e4 };
  for (const key in this.hooks) this.hooks[key] = [];
  _log("info", "Lifecycle resetado");
  return true;
};
LifecycleManager.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
};
LifecycleManager.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, state: this.currentState, isDestroyed: this.isDestroyed, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
LifecycleManager.prototype.resetMetrics = function() {
  this._metrics = { transitionCount: 0, hookCount: 0, errorCount: 0, recoveryCount: 0, lastTransitionAt: null };
};
function getVersion() {
  return VERSION;
}
var lifecycle_default = LifecycleManager;
export {
  HEADER_EVENTS,
  LIFECYCLE_EVENTS,
  LIFECYCLE_STATES,
  LifecycleManager,
  MODULE_ID,
  TIMEOUTS,
  VERSION,
  lifecycle_default as default,
  getPorts,
  getVersion,
  injectPorts
};
