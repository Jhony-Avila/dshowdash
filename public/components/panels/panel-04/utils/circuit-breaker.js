const MODULE_ID = "panel-04/utils/circuit-breaker";
const VERSION = "9.3.0-P2-ENTERPRISE";
const STATES = Object.freeze({
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN"
});
class CircuitBreaker {
  constructor(threshold = 5, timeout = 3e4, logger = null) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.logger = logger;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.state = STATES.CLOSED;
    this.stateChangedAt = Date.now();
    this.totalRequests = 0;
    this.lastError = null;
  }
  _log(level, action, data = {}) {
    if (this.logger?.[level]) {
      this.logger[level](action, data);
    } else if (this.logger?.info) {
      this.logger.info(action, data);
    }
  }
  check() {
    this.totalRequests++;
    if (this.state === STATES.OPEN) {
      const now = Date.now();
      const elapsed = now - this.lastFailureTime;
      if (elapsed > this.timeout) {
        this._setState(STATES.HALF_OPEN);
        this.failures = 0;
        this._log("debug", "circuit.half-open", { elapsed });
      } else {
        const remaining = Math.ceil((this.timeout - elapsed) / 1e3);
        throw new Error(`CIRCUIT_BREAKER_OPEN:${remaining}s`);
      }
    }
  }
  recordSuccess() {
    this.successes++;
    this.lastSuccessTime = Date.now();
    if (this.state === STATES.HALF_OPEN) {
      this._setState(STATES.CLOSED);
      this.failures = 0;
      this.lastError = null;
      this._log("debug", "circuit.closed", { successes: this.successes });
    }
  }
  recordFailure(error = null) {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.lastError = (error instanceof Error ? error.message : error) || "Unknown error";
    if (this.failures >= this.threshold && this.state !== STATES.OPEN) {
      this._setState(STATES.OPEN);
      this._log("warn", "circuit.open", {
        failures: this.failures,
        threshold: this.threshold,
        error: this.lastError
      });
    }
  }
  _setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.stateChangedAt = Date.now();
    this._log("debug", "circuit.state-change", { from: oldState, to: newState });
  }
  reset() {
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.lastError = null;
    this._setState(STATES.CLOSED);
    this.totalRequests = 0;
    this._log("debug", "circuit.reset");
  }
  forceOpen() {
    this._setState(STATES.OPEN);
    this.lastFailureTime = Date.now();
    this._log("warn", "circuit.force-open");
  }
  forceClosed() {
    this._setState(STATES.CLOSED);
    this.failures = 0;
    this.lastError = null;
    this._log("debug", "circuit.force-closed");
  }
  getState() {
    return this.state;
  }
  isOpen() {
    return this.state === STATES.OPEN;
  }
  isClosed() {
    return this.state === STATES.CLOSED;
  }
  isHalfOpen() {
    return this.state === STATES.HALF_OPEN;
  }
  getTimeUntilRetry() {
    if (this.state !== STATES.OPEN || !this.lastFailureTime) return 0;
    const elapsed = Date.now() - this.lastFailureTime;
    const remaining = this.timeout - elapsed;
    return Math.max(0, remaining);
  }
  getSuccessRate() {
    if (this.totalRequests === 0) return 100;
    return this.successes / this.totalRequests * 100;
  }
  healthCheck() {
    const now = Date.now();
    const successRate = this.getSuccessRate();
    return {
      status: this.state === STATES.CLOSED ? "HEALTHY" : this.state === STATES.HALF_OPEN ? "DEGRADED" : "UNHEALTHY",
      moduleId: MODULE_ID,
      version: VERSION,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      threshold: this.threshold,
      timeout: this.timeout,
      totalRequests: this.totalRequests,
      successRate: `${successRate.toFixed(1)}%`,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastSuccess: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null,
      lastError: this.lastError,
      stateAge: now - this.stateChangedAt,
      timeUntilRetry: this.getTimeUntilRetry(),
      healthy: this.state === STATES.CLOSED
    };
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      state: this.state,
      failures: this.failures,
      threshold: this.threshold,
      healthy: this.state === STATES.CLOSED
    };
  }
  async execute(fn, fallback) {
    try {
      this.check();
    } catch (e) {
      if (fallback) return fallback();
      throw e;
    }
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error);
      if (fallback) return fallback();
      throw error;
    }
  }
  getMetrics() {
    return { totalRequests: this.totalRequests || 0, failures: this.failures, successes: this.successes || 0 };
  }
  destroy() {
    this.reset();
  }
}
var circuit_breaker_default = CircuitBreaker;
export {
  CircuitBreaker,
  MODULE_ID,
  STATES,
  VERSION,
  circuit_breaker_default as default
};
