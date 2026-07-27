const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "header-components-shared-circuit-breaker-base";
function createModuleCircuitBreaker(moduleId) {
  const MODULE_ID2 = moduleId;
  const STATES = { CLOSED: "CLOSED", OPEN: "OPEN", HALF_OPEN: "HALF_OPEN" };
  const _metrics = { failures: 0, successes: 0, trips: 0, resets: 0, lastTripAt: null, rejectedCalls: 0, totalCalls: 0 };
  class CircuitBreaker {
    constructor(options = {}) {
      this.failureThreshold = options.failureThreshold || 5;
      this.resetTimeout = options.resetTimeout || 3e4;
      this.halfOpenMax = options.halfOpenMax || 3;
      this.state = STATES.CLOSED;
      this.failureCount = 0;
      this.lastFailureTime = null;
      this.nextAttemptTime = null;
      this.halfOpenSuccesses = 0;
    }
    async execute(fn, fallback) {
      _metrics.totalCalls++;
      if (this.state === STATES.OPEN) {
        if (Date.now() >= this.nextAttemptTime) {
          this.state = STATES.HALF_OPEN;
          this.halfOpenSuccesses = 0;
        } else {
          _metrics.rejectedCalls++;
          if (fallback) return fallback();
          throw new Error("Circuit breaker is OPEN");
        }
      }
      try {
        const result = await fn();
        this._onSuccess();
        return result;
      } catch (error) {
        this._onFailure();
        if (fallback) return fallback();
        throw error;
      }
    }
    _onSuccess() {
      _metrics.successes++;
      this.failureCount = 0;
      if (this.state === STATES.HALF_OPEN) {
        this.halfOpenSuccesses++;
        if (this.halfOpenSuccesses >= this.halfOpenMax) {
          this.state = STATES.CLOSED;
          _metrics.resets++;
        }
      }
    }
    _onFailure() {
      _metrics.failures++;
      this.failureCount++;
      this.lastFailureTime = Date.now();
      if (this.failureCount >= this.failureThreshold) {
        this.state = STATES.OPEN;
        this.nextAttemptTime = Date.now() + this.resetTimeout;
        _metrics.trips++;
        _metrics.lastTripAt = Date.now();
      }
    }
    reset() {
      this.state = STATES.CLOSED;
      this.failureCount = 0;
      this.nextAttemptTime = null;
      this.halfOpenSuccesses = 0;
      _metrics.resets++;
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
    destroy() {
      this.reset();
    }
    healthCheck() {
      const checks = { notOpen: this.state !== STATES.OPEN, lowFailures: this.failureCount < this.failureThreshold };
      const passed = Object.values(checks).filter(Boolean).length;
      let status = "HEALTHY";
      if (this.state === STATES.HALF_OPEN) status = "DEGRADED";
      if (this.state === STATES.OPEN) status = "UNHEALTHY";
      return { status, score: passed, maxScore: 2, checks, state: this.state, metrics: { ..._metrics }, version: VERSION, moduleId: MODULE_ID2 };
    }
    info() {
      return { version: VERSION, moduleId: MODULE_ID2, state: this.state, failureCount: this.failureCount, threshold: this.failureThreshold, metrics: { ..._metrics }, healthCheck: this.healthCheck() };
    }
  }
  function getMetrics() {
    return { ..._metrics };
  }
  function resetMetrics() {
    _metrics.failures = 0;
    _metrics.successes = 0;
    _metrics.trips = 0;
    _metrics.resets = 0;
    _metrics.lastTripAt = null;
    _metrics.rejectedCalls = 0;
    _metrics.totalCalls = 0;
  }
  return { CircuitBreaker, getMetrics, resetMetrics, MODULE_ID: MODULE_ID2, VERSION };
}
export {
  MODULE_ID,
  VERSION,
  createModuleCircuitBreaker
};
