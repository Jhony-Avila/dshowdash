const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-footer-settings/core/circuit-breaker";
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
    this.successCount++;
    if (this.state === "half-open") this.state = "closed";
  }
  _onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) this.state = "open";
  }
  reset() {
    this.state = "closed";
    this.failures = 0;
    this.lastFailure = null;
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    return { status: this.state === "closed" ? "HEALTHY" : "degraded", state: this.state, failures: this.failures, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: this.state, failures: this.failures, threshold: this.threshold, successCount: this.successCount, healthCheck: this.healthCheck() };
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
