const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-notifications/utils/circuit-breaker";
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
    this.state = CB_STATES.CLOSED;
    this.totalRequests = 0;
  }
  check() {
    this.totalRequests++;
    if (this.state === CB_STATES.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed > this.timeout) {
        this.state = CB_STATES.HALF_OPEN;
        this.failures = 0;
      } else {
        throw new Error(`CIRCUIT_BREAKER_OPEN:${Math.ceil((this.timeout - elapsed) / 1e3)}s`);
      }
    }
  }
  recordSuccess() {
    this.successes++;
    if (this.state === CB_STATES.HALF_OPEN) {
      this.state = CB_STATES.CLOSED;
      this.failures = 0;
    }
  }
  recordFailure(error) {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold && this.state !== CB_STATES.OPEN) {
      this.state = CB_STATES.OPEN;
      this.logger?.warn?.("circuit.open", { failures: this.failures });
    }
  }
  reset() {
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.state = CB_STATES.CLOSED;
    this.totalRequests = 0;
  }
  isOpen() {
    return this.state === CB_STATES.OPEN;
  }
  isClosed() {
    return this.state === CB_STATES.CLOSED;
  }
  healthCheck() {
    const successRate = this.totalRequests > 0 ? (this.successes / this.totalRequests * 100).toFixed(1) : 100;
    return { status: this.state === CB_STATES.CLOSED ? "HEALTHY" : "DEGRADED", state: this.state, failures: this.failures, threshold: this.threshold, successRate: `${successRate}%`, healthy: this.state === CB_STATES.CLOSED, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
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
  getState() {
    return this.state;
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
