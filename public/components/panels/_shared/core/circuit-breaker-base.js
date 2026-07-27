const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "_shared/core/circuit-breaker-base";
function createModuleCircuitBreaker(moduleId) {
  const MODULE_ID2 = moduleId;
  class CircuitBreaker {
    constructor(options = {}) {
      this.threshold = options.threshold || 5;
      this.timeout = options.timeout || 6e4;
      this.halfOpenMax = options.halfOpenMax || 3;
      this.state = "closed";
      this.failures = 0;
      this.lastFailure = null;
      this.halfOpenSuccesses = 0;
      this._metrics = { totalCalls: 0, successCalls: 0, failedCalls: 0, rejectedCalls: 0 };
    }
    async execute(fn, fallback) {
      this._metrics.totalCalls++;
      if (this.state === "open") {
        if (Date.now() - this.lastFailure > this.timeout) {
          this.state = "half-open";
          this.halfOpenSuccesses = 0;
        } else {
          this._metrics.rejectedCalls++;
          if (fallback) return fallback();
          throw new Error("Circuit breaker is open");
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
      this.failures = 0;
      this._metrics.successCalls++;
      if (this.state === "half-open") {
        this.halfOpenSuccesses++;
        if (this.halfOpenSuccesses >= this.halfOpenMax) this.state = "closed";
      }
    }
    _onFailure() {
      this.failures++;
      this.lastFailure = Date.now();
      this._metrics.failedCalls++;
      if (this.failures >= this.threshold) this.state = "open";
    }
    reset() {
      this.state = "closed";
      this.failures = 0;
      this.lastFailure = null;
      this.halfOpenSuccesses = 0;
    }
    getState() {
      return this.state;
    }
    isOpen() {
      return this.state === "open";
    }
    isClosed() {
      return this.state === "closed";
    }
    getMetrics() {
      return { ...this._metrics };
    }
    destroy() {
      this.reset();
    }
    healthCheck() {
      let status = "HEALTHY";
      if (this.state === "half-open") status = "DEGRADED";
      if (this.state === "open") status = "UNHEALTHY";
      return { status, state: this.state, failures: this.failures, threshold: this.threshold, metrics: this._metrics, version: VERSION, moduleId: MODULE_ID2 };
    }
    info() {
      return { version: VERSION, moduleId: MODULE_ID2, state: this.state, failures: this.failures, threshold: this.threshold, metrics: { ...this._metrics }, healthCheck: this.healthCheck() };
    }
  }
  return { CircuitBreaker, MODULE_ID: MODULE_ID2, VERSION };
}
export {
  MODULE_ID,
  VERSION,
  createModuleCircuitBreaker
};
