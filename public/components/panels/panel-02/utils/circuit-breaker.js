const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-02/utils/circuit-breaker";
const STATES = Object.freeze({ CLOSED: "CLOSED", OPEN: "OPEN", HALF_OPEN: "HALF_OPEN" });
class CircuitBreaker {
  constructor(threshold, timeout, logger) {
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
  }
  check() {
    this.totalRequests++;
    if (this.state === STATES.OPEN) {
      const now = Date.now();
      const elapsed = now - this.lastFailureTime;
      if (elapsed > this.timeout) {
        this.setState(STATES.HALF_OPEN);
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
    if (this.state === STATES.HALF_OPEN) {
      this.setState(STATES.CLOSED);
      this.failures = 0;
      this.logger?.info?.("circuit.closed", { successes: this.successes });
    }
  }
  recordFailure(error) {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold && this.state !== STATES.OPEN) {
      this.setState(STATES.OPEN);
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
    this.setState(STATES.CLOSED);
    this.totalRequests = 0;
    this.logger?.info?.("circuit.reset");
  }
  forceOpen() {
    this.setState(STATES.OPEN);
    this.lastFailureTime = Date.now();
    this.logger?.warn?.("circuit.force-open");
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
  healthCheck() {
    const now = Date.now();
    const successRate = this.totalRequests > 0 ? (this.successes / this.totalRequests * 100).toFixed(1) : 100;
    return { status: this.state === STATES.CLOSED ? "HEALTHY" : "DEGRADED", state: this.state, failures: this.failures, successes: this.successes, threshold: this.threshold, timeout: this.timeout, totalRequests: this.totalRequests, successRate: `${successRate}%`, lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null, lastSuccess: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null, stateAge: now - this.stateChangedAt, healthy: this.state === STATES.CLOSED, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: this.state, failures: this.failures, threshold: this.threshold, healthy: this.state === STATES.CLOSED, timestamp: Date.now() };
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
  CircuitBreaker,
  MODULE_ID,
  STATES,
  VERSION,
  circuit_breaker_default as default,
  getVersion
};
