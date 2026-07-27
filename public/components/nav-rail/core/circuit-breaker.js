const VERSION = "5.0.0-P4-ENTERPRISE";
const MODULE_ID = "nav-rail.core.circuit-breaker";
let _log = () => {
};
function setLogger(logFn) {
  _log = logFn;
}
const CircuitBreaker = {
  _failures: {},
  _thresholds: { maxFailures: 3, resetTimeout: 3e4 },
  isOpen(service) {
    const state = this._failures[service];
    if (!state) return false;
    if (state.failures >= this._thresholds.maxFailures) {
      if (Date.now() - state.lastFailure > this._thresholds.resetTimeout) {
        this.reset(service);
        return false;
      }
      return true;
    }
    return false;
  },
  recordFailure(service, error) {
    if (!this._failures[service]) {
      this._failures[service] = { failures: 0, lastFailure: 0, errors: [] };
    }
    this._failures[service].failures++;
    this._failures[service].lastFailure = Date.now();
    this._failures[service].errors.push({ message: error?.message || String(error), time: Date.now() });
    if (this._failures[service].errors.length > 5) this._failures[service].errors.shift();
    _log("warn", `Circuit breaker: ${service} failure #${this._failures[service].failures}`, { error: error?.message });
  },
  recordSuccess(service) {
    if (this._failures[service]) {
      this._failures[service].failures = Math.max(0, this._failures[service].failures - 1);
    }
  },
  reset(service) {
    if (service) {
      delete this._failures[service];
    } else {
      this._failures = {};
    }
  },
  async execute(service, fn, fallback) {
    if (this.isOpen(service)) {
      if (fallback) return fallback();
      throw new Error("Circuit breaker is open for: " + service);
    }
    try {
      const result = await fn();
      this.recordSuccess(service);
      return result;
    } catch (error) {
      this.recordFailure(service, error);
      if (fallback) return fallback();
      throw error;
    }
  },
  getMetrics() {
    let totalFailures = 0;
    let openCircuits = 0;
    for (const [service, state] of Object.entries(this._failures)) {
      totalFailures += state.failures;
      if (this.isOpen(service)) openCircuits++;
    }
    return { trackedServices: Object.keys(this._failures).length, openCircuits, totalFailures };
  },
  healthCheck() {
    const metrics = this.getMetrics();
    return {
      status: metrics.openCircuits === 0 ? "HEALTHY" : metrics.openCircuits < 3 ? "DEGRADED" : "UNHEALTHY",
      moduleId: "navrail-core-circuit-breaker",
      checks: metrics,
      timestamp: Date.now()
    };
  },
  info() {
    return { moduleId: "navrail-core-circuit-breaker", metrics: this.getMetrics(), status: this.getStatus() };
  },
  getStatus() {
    const status = {};
    for (const [service, state] of Object.entries(this._failures)) {
      status[service] = {
        isOpen: this.isOpen(service),
        failures: state.failures,
        lastFailure: state.lastFailure,
        recentErrors: state.errors.slice(-3)
      };
    }
    return status;
  },
  destroy() {
    for (const k of Object.keys(this._failures)) this.reset(k);
  }
};
var circuit_breaker_default = CircuitBreaker;
export {
  CircuitBreaker,
  MODULE_ID,
  VERSION,
  circuit_breaker_default as default,
  setLogger
};
