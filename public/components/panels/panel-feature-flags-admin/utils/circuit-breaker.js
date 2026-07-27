const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-feature-flags-admin/utils/circuit-breaker";
const CB_STATES = Object.freeze({
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN"
});
class CircuitBreaker {
  constructor(threshold, timeout, logger) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.logger = logger;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.state = CB_STATES.CLOSED;
    this.stateChangedAt = Date.now();
    this.totalRequests = 0;
  }
  check() {
    this.totalRequests++;
    if (this.state === CB_STATES.OPEN) {
      const now = Date.now();
      const elapsed = now - this.lastFailureTime;
      if (elapsed > this.timeout) {
        this.setState(CB_STATES.HALF_OPEN);
        this.failures = 0;
        this.logger?.info?.("circuit.half-open", { elapsed });
      } else {
        const remaining = Math.ceil((this.timeout - elapsed) / 1e3);
        throw new Error(`CIRCUIT_BREAKER_OPEN:${remaining}s`);
      }
    }
  }
  recordSuccess() {
    this.successes++;
    this.lastSuccessTime = Date.now();
    if (this.state === CB_STATES.HALF_OPEN) {
      this.setState(CB_STATES.CLOSED);
      this.failures = 0;
      this.logger?.info?.("circuit.closed", { successes: this.successes });
    }
  }
  recordFailure(error) {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold && this.state !== CB_STATES.OPEN) {
      this.setState(CB_STATES.OPEN);
      this.logger?.warn?.("circuit.open", { failures: this.failures, threshold: this.threshold, error: error?.message });
    }
  }
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.stateChangedAt = Date.now();
    this.logger?.debug?.("circuit.state-change", { from: oldState, to: newState });
  }
  reset() {
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.setState(CB_STATES.CLOSED);
    this.totalRequests = 0;
    this.logger?.info?.("circuit.reset");
  }
  forceOpen() {
    this.setState(CB_STATES.OPEN);
    this.lastFailureTime = Date.now();
    this.logger?.warn?.("circuit.force-open");
  }
  getState() {
    return this.state;
  }
  isOpen() {
    return this.state === CB_STATES.OPEN;
  }
  isClosed() {
    return this.state === CB_STATES.CLOSED;
  }
  healthCheck() {
    const successRate = this.totalRequests > 0 ? (this.successes / this.totalRequests * 100).toFixed(1) : 100;
    return { status: this.state === CB_STATES.CLOSED ? "HEALTHY" : "DEGRADED", state: this.state, failures: this.failures, successes: this.successes, threshold: this.threshold, totalRequests: this.totalRequests, successRate: `${successRate}%`, healthy: this.state === CB_STATES.CLOSED, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: this.state, failures: this.failures, threshold: this.threshold, healthy: this.state === CB_STATES.CLOSED, timestamp: Date.now() };
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
function getVersion() {
  return VERSION;
}
var circuit_breaker_default = CircuitBreaker;
export {
  CB_STATES,
  CircuitBreaker,
  MODULE_ID,
  VERSION,
  circuit_breaker_default as default,
  getVersion
};
