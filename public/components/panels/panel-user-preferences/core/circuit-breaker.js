const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-user-preferences/core/circuit-breaker";
class CircuitBreaker {
  constructor(options = {}) {
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 6e4;
    this.state = "closed";
    this.failures = 0;
    this.lastFailure = null;
    this.successCount = 0;
  }
  async execute(fn, fallback) {
    if (this.state === "open") {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = "half-open";
      } else {
        if (fallback) return fallback();
        throw new Error("Circuit breaker is open");
      }
    }
    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }
  _onSuccess() {
    this.failures = 0;
    this.successCount++;
    this.state = "closed";
  }
  _onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = "open";
    }
  }
  reset() {
    this.state = "closed";
    this.failures = 0;
    this.lastFailure = null;
    this.successCount = 0;
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const checks = {
      circuitClosed: this.state === "closed",
      belowThreshold: this.failures < this.threshold
    };
    const passed = Object.values(checks).filter(Boolean).length;
    return {
      status: passed === 2 ? "HEALTHY" : "DEGRADED",
      score: passed,
      maxScore: 2,
      state: this.state,
      failures: this.failures,
      version: VERSION,
      moduleId: MODULE_ID
    };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, state: this.state, failures: this.failures };
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
  VERSION,
  circuit_breaker_default as default
};
