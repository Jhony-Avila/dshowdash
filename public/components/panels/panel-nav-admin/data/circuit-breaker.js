import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE2";
const MODULE_ID = "panel-nav-admin.data.circuit-breaker";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
  const prefix = "[CircuitBreaker]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "warn") logger.warn?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const CB_STATES = Object.freeze({
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN"
});
class CircuitBreaker {
  /**
   * @param {Object} [options]
   * @param {number} [options.failureThreshold=5] — Falhas para abrir o circuito
   * @param {number} [options.resetTimeout=30000] — Tempo em ms para tentar half-open
   * @param {number} [options.halfOpenMax=1] — Chamadas permitidas em half-open
   * @param {string} [options.name='default'] — Nome identificador
   */
  constructor(options = {}) {
    this.name = options.name || "default";
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 3e4;
    this.halfOpenMax = options.halfOpenMax || 1;
    this._state = CB_STATES.CLOSED;
    this._failureCount = 0;
    this._successCount = 0;
    this._halfOpenAttempts = 0;
    this._lastFailureTime = 0;
    this._totalCalls = 0;
    this._totalFailures = 0;
    this._totalSuccesses = 0;
    this._lastError = null;
  }
  /**
   * Execute an async function through the circuit breaker.
   * @param {Function} fn — Async function to execute
   * @param {Function} [fallback] — Optional fallback if circuit is open
   * @returns {Promise<*>}
   * @throws {Error} If circuit is open and no fallback provided
   */
  async execute(fn, fallback) {
    this._totalCalls++;
    if (this._state === CB_STATES.OPEN) {
      if (Date.now() - this._lastFailureTime >= this.resetTimeout) {
        this._state = CB_STATES.HALF_OPEN;
        this._halfOpenAttempts = 0;
        _log("info", `[${this.name}] Half-open: testing connection`);
      } else {
        _log("debug", `[${this.name}] Circuit OPEN \u2014 rejecting call`);
        if (fallback) return fallback(this._lastError);
        throw new Error(`Circuit breaker [${this.name}] is OPEN. Try again later.`);
      }
    }
    if (this._state === CB_STATES.HALF_OPEN && this._halfOpenAttempts >= this.halfOpenMax) {
      if (fallback) return fallback(this._lastError);
      throw new Error(`Circuit breaker [${this.name}] HALF_OPEN limit reached.`);
    }
    try {
      if (this._state === CB_STATES.HALF_OPEN) this._halfOpenAttempts++;
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure(error);
      if (fallback) return fallback(error);
      throw error;
    }
  }
  /** @private Handle successful call */
  _onSuccess() {
    this._totalSuccesses++;
    this._successCount++;
    if (this._state === CB_STATES.HALF_OPEN) {
      _log("info", `[${this.name}] Circuit CLOSED (recovered)`);
      this._state = CB_STATES.CLOSED;
      this._failureCount = 0;
      this._halfOpenAttempts = 0;
    } else {
      this._failureCount = 0;
    }
  }
  /** @private Handle failed call */
  _onFailure(error) {
    this._totalFailures++;
    this._failureCount++;
    this._lastError = error;
    this._lastFailureTime = Date.now();
    if (this._state === CB_STATES.HALF_OPEN) {
      _log("warn", `[${this.name}] Half-open test FAILED \u2014 circuit OPEN`);
      this._state = CB_STATES.OPEN;
      return;
    }
    if (this._failureCount >= this.failureThreshold) {
      _log("warn", `[${this.name}] Threshold reached (${this._failureCount}) \u2014 circuit OPEN`);
      this._state = CB_STATES.OPEN;
    }
  }
  /** @returns {string} Current circuit state */
  getState() {
    return this._state;
  }
  /** @returns {boolean} Whether circuit is closed (healthy) */
  isClosed() {
    return this._state === CB_STATES.CLOSED;
  }
  /** @returns {boolean} Whether circuit is open (rejecting) */
  isOpen() {
    return this._state === CB_STATES.OPEN;
  }
  /** Force-reset the circuit to CLOSED. */
  reset() {
    this._state = CB_STATES.CLOSED;
    this._failureCount = 0;
    this._halfOpenAttempts = 0;
    this._lastError = null;
    _log("info", `[${this.name}] Circuit manually reset to CLOSED`);
  }
  /** @returns {Object} Metrics snapshot */
  getMetrics() {
    return {
      name: this.name,
      state: this._state,
      failureCount: this._failureCount,
      successCount: this._successCount,
      totalCalls: this._totalCalls,
      totalFailures: this._totalFailures,
      totalSuccesses: this._totalSuccesses,
      lastFailureTime: this._lastFailureTime,
      lastError: this._lastError ? this._lastError.message : null
    };
  }
}
function createCircuitBreaker(options = {}) {
  return new CircuitBreaker(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var circuit_breaker_default = { CB_STATES, CircuitBreaker, createCircuitBreaker, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  CB_STATES,
  CircuitBreaker,
  MODULE_ID,
  VERSION,
  createCircuitBreaker,
  circuit_breaker_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
