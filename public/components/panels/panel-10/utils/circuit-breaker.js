const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-10-circuit-breaker";
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
    this.state = STATES.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.openedAt = null;
    this.halfOpenSuccessesRequired = 3;
    this.halfOpenSuccesses = 0;
    this._metrics = {
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      timesOpened: 0,
      lastStateChange: null
    };
  }
  // ═══════════════════════════════════════════════════════════════
  // CHECK STATE
  // ═══════════════════════════════════════════════════════════════
  check() {
    this._metrics.totalCalls++;
    if (this.state === STATES.OPEN) {
      const now = Date.now();
      const elapsed = now - this.openedAt;
      if (elapsed >= this.timeout) {
        this._transition(STATES.HALF_OPEN);
        this.halfOpenSuccesses = 0;
        this.logger?.info?.("circuit.half-open", {
          elapsed: `${Math.round(elapsed / 1e3)}s`,
          threshold: this.threshold
        });
        return;
      }
      const remainingMs = this.timeout - elapsed;
      throw new Error(`CIRCUIT_BREAKER_OPEN:${Math.ceil(remainingMs / 1e3)}s`);
    }
  }
  // ═══════════════════════════════════════════════════════════════
  // RECORD SUCCESS/FAILURE
  // ═══════════════════════════════════════════════════════════════
  recordSuccess() {
    this.successes++;
    this.lastSuccessTime = Date.now();
    this._metrics.totalSuccesses++;
    if (this.state === STATES.HALF_OPEN) {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.halfOpenSuccessesRequired) {
        this._transition(STATES.CLOSED);
        this.failures = 0;
        this.halfOpenSuccesses = 0;
        this.logger?.info?.("circuit.closed", {
          reason: "recovery-complete",
          successesRequired: this.halfOpenSuccessesRequired
        });
      } else {
        this.logger?.debug?.("circuit.half-open-progress", {
          successes: this.halfOpenSuccesses,
          required: this.halfOpenSuccessesRequired
        });
      }
    } else if (this.state === STATES.CLOSED && this.failures > 0) {
      this.failures = Math.max(0, this.failures - 1);
    }
  }
  recordFailure(error = null) {
    this.failures++;
    this.lastFailureTime = Date.now();
    this._metrics.totalFailures++;
    if (this.state === STATES.HALF_OPEN) {
      this._transition(STATES.OPEN);
      this.openedAt = Date.now();
      this.logger?.warn?.("circuit.reopened", {
        reason: "half-open-failure",
        error: error?.message
      });
    } else if (this.failures >= this.threshold && this.state === STATES.CLOSED) {
      this._transition(STATES.OPEN);
      this.openedAt = Date.now();
      this._metrics.timesOpened++;
      this.logger?.warn?.("circuit.opened", {
        failures: this.failures,
        threshold: this.threshold
      });
    }
  }
  // ═══════════════════════════════════════════════════════════════
  // STATE TRANSITION
  // ═══════════════════════════════════════════════════════════════
  _transition(newState) {
    const oldState = this.state;
    this.state = newState;
    this._metrics.lastStateChange = Date.now();
    this.logger?.debug?.("circuit.transition", {
      from: oldState,
      to: newState
    });
  }
  // ═══════════════════════════════════════════════════════════════
  // MANUAL CONTROLS
  // ═══════════════════════════════════════════════════════════════
  reset() {
    this._transition(STATES.CLOSED);
    this.failures = 0;
    this.successes = 0;
    this.halfOpenSuccesses = 0;
    this.lastFailureTime = null;
    this.openedAt = null;
    this.logger?.info?.("circuit.reset");
  }
  forceOpen() {
    this._transition(STATES.OPEN);
    this.openedAt = Date.now();
    this._metrics.timesOpened++;
    this.logger?.warn?.("circuit.force-opened");
  }
  forceClose() {
    this._transition(STATES.CLOSED);
    this.failures = 0;
    this.openedAt = null;
    this.logger?.info?.("circuit.force-closed");
  }
  // ═══════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════
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
  canRequest() {
    if (this.state === STATES.CLOSED) return true;
    if (this.state === STATES.HALF_OPEN) return true;
    if (this.state === STATES.OPEN) {
      return Date.now() - this.openedAt >= this.timeout;
    }
    return false;
  }
  getMetrics() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      threshold: this.threshold,
      timeout: this.timeout,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      openedAt: this.openedAt,
      ...this._metrics,
      successRate: this._metrics.totalCalls > 0 ? `${(this._metrics.totalSuccesses / this._metrics.totalCalls * 100).toFixed(1)}%` : "0%"
    };
  }
  healthCheck() {
    return {
      status: this.state === STATES.CLOSED ? "HEALTHY" : this.state === STATES.HALF_OPEN ? "DEGRADED" : "UNHEALTHY",
      state: this.state,
      failures: this.failures,
      threshold: this.threshold,
      canRequest: this.canRequest(),
      metrics: this.getMetrics(),
      version: VERSION,
      moduleId: MODULE_ID
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
  destroy() {
    this.reset();
  }
}
var circuit_breaker_default = CircuitBreaker;
export {
  STATES as CIRCUIT_STATES,
  CircuitBreaker,
  MODULE_ID,
  VERSION,
  circuit_breaker_default as default
};
