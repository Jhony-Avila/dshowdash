import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { CIRCUIT_STATE } from "./constants.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/circuit-breaker-api";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
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
const _breakers = /* @__PURE__ */ new Map();
const _globalMetrics = { totalCreated: 0, totalOpened: 0, totalClosed: 0, totalHalfOpen: 0, totalRequests: 0, totalSuccesses: 0, totalFailures: 0, totalRejected: 0 };
const DEFAULT_OPTIONS = { maxFailures: 3, resetTimeout: 6e4, halfOpenMaxAttempts: 2, successThreshold: 2, timeout: 5e3 };
function CircuitBreakerAPI(componentName, options) {
  options = options || {};
  this.componentName = componentName;
  this.state = CIRCUIT_STATE.CLOSED;
  this.failures = 0;
  this.successes = 0;
  this.halfOpenAttempts = 0;
  this.lastFailureTime = null;
  this.lastSuccessTime = null;
  this.lastStateChange = Date.now();
  this.maxFailures = options.maxFailures || DEFAULT_OPTIONS.maxFailures;
  this.resetTimeout = options.resetTimeout || DEFAULT_OPTIONS.resetTimeout;
  this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || DEFAULT_OPTIONS.halfOpenMaxAttempts;
  this.successThreshold = options.successThreshold || DEFAULT_OPTIONS.successThreshold;
  this.timeout = options.timeout || DEFAULT_OPTIONS.timeout;
  this._metrics = { requests: 0, successes: 0, failures: 0, rejected: 0, timeouts: 0, stateChanges: 0, lastRequestAt: null };
  this._listeners = [];
  _initPorts();
  _log("debug", "CircuitBreaker criado para:", componentName);
}
CircuitBreakerAPI.prototype._setState = function(newState) {
  const oldState = this.state;
  if (oldState === newState) return;
  this.state = newState;
  this.lastStateChange = Date.now();
  this._metrics.stateChanges++;
  if (newState === CIRCUIT_STATE.OPEN) _globalMetrics.totalOpened++;
  if (newState === CIRCUIT_STATE.CLOSED) _globalMetrics.totalClosed++;
  if (newState === CIRCUIT_STATE.HALF_OPEN) _globalMetrics.totalHalfOpen++;
  this._notifyListeners({ type: "stateChange", oldState, newState, componentName: this.componentName, timestamp: Date.now() });
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit("header:circuit-breaker:state-change", { componentName: this.componentName, oldState, newState, failures: this.failures, timestamp: Date.now() });
  }
  _log("info", "CircuitBreaker", this.componentName, ":", oldState, "->", newState);
};
CircuitBreakerAPI.prototype._checkState = function() {
  if (this.state === CIRCUIT_STATE.OPEN) {
    const timeSinceFailure = Date.now() - this.lastFailureTime;
    if (timeSinceFailure >= this.resetTimeout) {
      this._setState(CIRCUIT_STATE.HALF_OPEN);
      this.halfOpenAttempts = 0;
      this.successes = 0;
    }
  }
};
CircuitBreakerAPI.prototype.canExecute = function() {
  this._checkState();
  if (this.state === CIRCUIT_STATE.CLOSED) return true;
  if (this.state === CIRCUIT_STATE.HALF_OPEN) return this.halfOpenAttempts < this.halfOpenMaxAttempts;
  return false;
};
CircuitBreakerAPI.prototype.execute = function(fn, fallback) {
  const self = this;
  this._metrics.requests++;
  this._metrics.lastRequestAt = Date.now();
  _globalMetrics.totalRequests++;
  if (!this.canExecute()) {
    this._metrics.rejected++;
    _globalMetrics.totalRejected++;
    _log("warn", "CircuitBreaker REJEITOU request para:", this.componentName);
    if (typeof fallback === "function") return Promise.resolve(fallback(new Error(`Circuit breaker open for ${this.componentName}`)));
    return Promise.reject(new Error(`Circuit breaker open for ${this.componentName}`));
  }
  if (this.state === CIRCUIT_STATE.HALF_OPEN) this.halfOpenAttempts++;
  return self._executeWithTimeout(fn).then((result) => {
    self.recordSuccess();
    return result;
  }).catch((error) => {
    self.recordFailure(error);
    if (typeof fallback === "function") return fallback(error);
    throw error;
  });
};
CircuitBreakerAPI.prototype._executeWithTimeout = function(fn) {
  const self = this;
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      self._metrics.timeouts++;
      reject(new Error(`Timeout ap\xF3s ${self.timeout}ms`));
    }, self.timeout);
    Promise.resolve(fn()).then((result) => {
      clearTimeout(timeoutId);
      resolve(result);
    }).catch((error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
};
CircuitBreakerAPI.prototype.recordSuccess = function() {
  this._metrics.successes++;
  _globalMetrics.totalSuccesses++;
  this.lastSuccessTime = Date.now();
  this.successes++;
  if (this.state === CIRCUIT_STATE.HALF_OPEN) {
    if (this.successes >= this.successThreshold) {
      this._setState(CIRCUIT_STATE.CLOSED);
      this.failures = 0;
      this.successes = 0;
      this.halfOpenAttempts = 0;
      _log("info", "CircuitBreaker RECUPERADO:", this.componentName);
    }
  } else if (this.state === CIRCUIT_STATE.CLOSED) {
    this.failures = 0;
  }
};
CircuitBreakerAPI.prototype.recordFailure = function(error) {
  this._metrics.failures++;
  _globalMetrics.totalFailures++;
  this.lastFailureTime = Date.now();
  this.failures++;
  this.successes = 0;
  if (this.state === CIRCUIT_STATE.HALF_OPEN) {
    this._setState(CIRCUIT_STATE.OPEN);
    _log("warn", "CircuitBreaker REABERTO (half-open falhou):", this.componentName);
  } else if (this.state === CIRCUIT_STATE.CLOSED) {
    if (this.failures >= this.maxFailures) {
      this._setState(CIRCUIT_STATE.OPEN);
      _log("warn", "CircuitBreaker ABERTO ap\xF3s", this.failures, "falhas:", this.componentName);
    }
  }
  this._notifyListeners({ type: "failure", error: error ? error.message : "unknown", componentName: this.componentName, failures: this.failures, state: this.state, timestamp: Date.now() });
};
CircuitBreakerAPI.prototype.reset = function() {
  this.state = CIRCUIT_STATE.CLOSED;
  this.failures = 0;
  this.successes = 0;
  this.halfOpenAttempts = 0;
  this.lastFailureTime = null;
  this.lastStateChange = Date.now();
  _log("info", "CircuitBreaker RESET:", this.componentName);
};
CircuitBreakerAPI.prototype.forceOpen = function() {
  this._setState(CIRCUIT_STATE.OPEN);
  this.lastFailureTime = Date.now();
};
CircuitBreakerAPI.prototype.forceClose = function() {
  this._setState(CIRCUIT_STATE.CLOSED);
  this.failures = 0;
};
CircuitBreakerAPI.prototype.onStateChange = function(callback) {
  if (typeof callback !== "function") return () => {
  };
  this._listeners.push(callback);
  const self = this;
  return () => {
    const idx = self._listeners.indexOf(callback);
    if (idx > -1) self._listeners.splice(idx, 1);
  };
};
CircuitBreakerAPI.prototype._notifyListeners = function(event) {
  this._listeners.forEach((cb) => {
    try {
      cb(event);
    } catch (e) {
      _log("error", "Listener error:", e.message);
    }
  });
};
CircuitBreakerAPI.prototype.getStatus = function() {
  this._checkState();
  return { componentName: this.componentName, state: this.state, isOpen: this.state === CIRCUIT_STATE.OPEN, isClosed: this.state === CIRCUIT_STATE.CLOSED, isHalfOpen: this.state === CIRCUIT_STATE.HALF_OPEN, failures: this.failures, successes: this.successes, maxFailures: this.maxFailures, lastFailureTime: this.lastFailureTime, lastSuccessTime: this.lastSuccessTime, lastStateChange: this.lastStateChange, halfOpenAttempts: this.halfOpenAttempts };
};
CircuitBreakerAPI.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, this.getStatus());
};
function getBreaker(componentName, options) {
  _initPorts();
  if (_breakers.has(componentName)) return _breakers.get(componentName);
  const breaker = new CircuitBreakerAPI(componentName, options);
  _breakers.set(componentName, breaker);
  _globalMetrics.totalCreated++;
  return breaker;
}
function hasBreaker(componentName) {
  return _breakers.has(componentName);
}
function removeBreaker(componentName) {
  return _breakers.delete(componentName);
}
function getAllBreakers() {
  const result = {};
  _breakers.forEach((breaker, name) => {
    result[name] = breaker.getStatus();
  });
  return result;
}
function getOpenBreakers() {
  const open = [];
  _breakers.forEach((breaker, name) => {
    if (breaker.state === CIRCUIT_STATE.OPEN) open.push(name);
  });
  return open;
}
function resetAll() {
  _breakers.forEach((breaker) => {
    breaker.reset();
  });
  _log("info", "Todos os CircuitBreakers resetados");
}
function getGlobalMetrics() {
  return Object.assign({}, _globalMetrics, { activeBreakers: _breakers.size, openBreakers: getOpenBreakers().length });
}
function healthCheck() {
  _initPorts();
  const openBreakers = getOpenBreakers();
  const hasActivity = _globalMetrics.totalRequests > 0;
  const checks = {
    hasBreakers: _breakers.size > 0 || !hasActivity,
    noOpenBreakers: openBreakers.length === 0,
    lowRejectionRate: _globalMetrics.totalRequests === 0 || _globalMetrics.totalRejected / _globalMetrics.totalRequests < 0.1,
    portsInitialized: _portsInitialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    openBreakers,
    totalBreakers: _breakers.size,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, totalBreakers: _breakers.size, breakers: getAllBreakers(), globalMetrics: getGlobalMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var circuit_breaker_api_default = { VERSION, MODULE_ID, CircuitBreakerAPI, getBreaker, hasBreaker, removeBreaker, getAllBreakers, getOpenBreakers, resetAll, getGlobalMetrics, healthCheck, info };
export {
  CIRCUIT_STATE,
  CircuitBreakerAPI,
  DEFAULT_OPTIONS,
  MODULE_ID,
  VERSION,
  circuit_breaker_api_default as default,
  getAllBreakers,
  getBreaker,
  getGlobalMetrics,
  getOpenBreakers,
  getPorts,
  hasBreaker,
  healthCheck,
  info,
  injectPorts,
  removeBreaker,
  resetAll
};
