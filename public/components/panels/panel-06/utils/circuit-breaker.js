const MODULE_ID = "panels-panel-06-utils-circuit-breaker";
const VERSION = "9.3.0-P2-ENTERPRISE";
CircuitBreaker.prototype.execute = async function(fn, fallback) {
  try {
    this.check();
  } catch (e) {
    if (fallback) return fallback();
    throw e;
  }
  try {
    var result = await fn();
    this.recordSuccess();
    return result;
  } catch (error) {
    this.recordFailure(error);
    if (fallback) return fallback();
    throw error;
  }
};
function CircuitBreaker(threshold, timeout, logger) {
  this.threshold = threshold;
  this.timeout = timeout;
  this.logger = logger;
  this.failures = 0;
  this.lastFailureTime = null;
  this.state = "CLOSED";
}
CircuitBreaker.prototype.check = function() {
  if (this.state === "OPEN") {
    const now = Date.now();
    if (now - this.lastFailureTime > this.timeout) {
      this.state = "HALF_OPEN";
      this.failures = 0;
      this.logger.info("circuit.half-open");
    } else {
      throw new Error("CIRCUIT_BREAKER_OPEN");
    }
  }
};
CircuitBreaker.prototype.recordSuccess = function() {
  if (this.state === "HALF_OPEN") {
    this.state = "CLOSED";
    this.failures = 0;
    this.logger.info("circuit.closed");
  }
};
CircuitBreaker.prototype.recordFailure = function() {
  this.failures++;
  this.lastFailureTime = Date.now();
  if (this.failures >= this.threshold && this.state !== "OPEN") {
    this.state = "OPEN";
    this.logger.warn("circuit.open", { failures: this.failures });
  }
};
CircuitBreaker.prototype.getState = function() {
  return this.state;
};
CircuitBreaker.prototype.getMetrics = function() {
  return { failures: this.failures || 0, successes: this.successes || 0, totalRequests: this.totalRequests || 0 };
};
CircuitBreaker.prototype.reset = function() {
  this.failures = 0;
  this.state = "CLOSED";
  this.lastFailureTime = null;
};
CircuitBreaker.prototype.destroy = function() {
  this.reset();
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { circuitBreakerReady: true } };
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
