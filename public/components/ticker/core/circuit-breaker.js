import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "ticker.core.circuit-breaker";
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};
const STATES = Object.freeze({ CLOSED: "closed", OPEN: "open", HALF_OPEN: "half-open" });
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 3e4;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 1;
    this._state = STATES.CLOSED;
    this._failureCount = 0;
    this._successCount = 0;
    this._lastFailureTime = null;
    this._halfOpenAttempts = 0;
    this._metrics = { totalCalls: 0, successCalls: 0, failedCalls: 0, rejectedCalls: 0, stateChanges: 0 };
    this._subscribers = /* @__PURE__ */ new Set();
  }
  get state() {
    return this._state;
  }
  get isOpen() {
    return this._state === STATES.OPEN;
  }
  get isClosed() {
    return this._state === STATES.CLOSED;
  }
  get isHalfOpen() {
    return this._state === STATES.HALF_OPEN;
  }
  async execute(fn, fallback) {
    this._metrics.totalCalls++;
    if (this._state === STATES.OPEN) {
      if (this._shouldAttemptReset()) {
        this._transitionTo(STATES.HALF_OPEN);
      } else {
        this._metrics.rejectedCalls++;
        _log("warn", "Circuit OPEN - request rejected");
        if (fallback) return fallback();
        throw new Error("Circuit breaker is OPEN");
      }
    }
    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure(error);
      if (fallback) return fallback();
      throw error;
    }
  }
  _onSuccess() {
    this._metrics.successCalls++;
    this._failureCount = 0;
    this._successCount++;
    if (this._state === STATES.HALF_OPEN) {
      this._transitionTo(STATES.CLOSED);
      _log("info", "Circuit CLOSED - recovered");
    }
  }
  _onFailure(error) {
    this._metrics.failedCalls++;
    this._failureCount++;
    this._lastFailureTime = Date.now();
    _log("warn", `Failure ${this._failureCount}/${this.failureThreshold}`, { error: error.message });
    if (this._state === STATES.HALF_OPEN) {
      this._halfOpenAttempts++;
      if (this._halfOpenAttempts >= this.halfOpenMaxAttempts) {
        this._transitionTo(STATES.OPEN);
      }
    } else if (this._failureCount >= this.failureThreshold) {
      this._transitionTo(STATES.OPEN);
      _log("error", "Circuit OPEN - threshold reached");
    }
  }
  _shouldAttemptReset() {
    return this._lastFailureTime && Date.now() - this._lastFailureTime >= this.resetTimeout;
  }
  _transitionTo(newState) {
    const oldState = this._state;
    this._state = newState;
    this._metrics.stateChanges++;
    if (newState === STATES.HALF_OPEN) {
      this._halfOpenAttempts = 0;
    }
    if (newState === STATES.CLOSED) {
      this._failureCount = 0;
      this._successCount = 0;
    }
    this._notifySubscribers({ oldState, newState, timestamp: Date.now() });
    _log("info", `State: ${oldState} -> ${newState}`);
  }
  reset() {
    this._transitionTo(STATES.CLOSED);
    this._failureCount = 0;
    this._lastFailureTime = null;
    _log("info", "Circuit manually reset");
  }
  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }
  _notifySubscribers(data) {
    this._subscribers.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
      }
    });
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { isClosed: this.isClosed, lowFailureCount: this._failureCount < this.failureThreshold, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 4 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/4`, state: this._state, failureCount: this._failureCount, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: this._state, failureCount: this._failureCount, threshold: this.failureThreshold, resetTimeout: this.resetTimeout, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  destroy() {
    this.reset();
  }
}
const STATES_ENUM = STATES;
function getVersion() {
  return VERSION;
}
var circuit_breaker_default = CircuitBreaker;
export {
  CircuitBreaker,
  MODULE_ID,
  STATES_ENUM,
  VERSION,
  circuit_breaker_default as default,
  getPorts,
  getVersion,
  injectPorts
};
