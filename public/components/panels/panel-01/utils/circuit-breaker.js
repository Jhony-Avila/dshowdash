const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/circuit-breaker";
const STATE = { CLOSED: "CLOSED", OPEN: "OPEN", HALF_OPEN: "HALF_OPEN" };
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 3e4;
    this.halfOpenRequests = options.halfOpenRequests || 1;
    this.state = STATE.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
    this.halfOpenAttempts = 0;
  }
  async call(fn) {
    if (this.state === STATE.OPEN) {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = STATE.HALF_OPEN;
        this.halfOpenAttempts = 0;
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }
    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }
  _onSuccess() {
    this.failures = 0;
    if (this.state === STATE.HALF_OPEN) {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.halfOpenRequests) {
        this.state = STATE.CLOSED;
      }
    }
  }
  _onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = STATE.OPEN;
    }
  }
  reset() {
    this.state = STATE.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
  }
  getState() {
    return { state: this.state, failures: this.failures, lastFailure: this.lastFailure };
  }
  async execute(fn, fallback) {
    try {
      return await this.call(fn);
    } catch (error) {
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
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var circuit_breaker_default = CircuitBreaker;
export {
  CircuitBreaker,
  MODULE_ID,
  VERSION,
  circuit_breaker_default as default,
  healthCheck,
  info
};
