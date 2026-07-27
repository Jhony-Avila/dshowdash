import { CircuitBreaker } from "./circuit-breaker.js";
const VERSION = "5.0.0-P4-ENTERPRISE";
const MODULE_ID = "nav-rail.core.retry-manager";
let _log = () => {
};
function setLogger(logFn) {
  _log = logFn;
}
const RetryManager = {
  async execute(fn, options = {}) {
    const { maxAttempts = 3, baseDelay = 1e3, maxDelay = 1e4, serviceName = "unknown" } = options;
    if (CircuitBreaker.isOpen(serviceName)) {
      _log("warn", `Circuit open for ${serviceName}, using fallback`);
      throw new Error(`Circuit breaker open for ${serviceName}`);
    }
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        CircuitBreaker.recordSuccess(serviceName);
        return result;
      } catch (error) {
        lastError = error;
        CircuitBreaker.recordFailure(serviceName, error);
        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          _log("warn", `${serviceName} attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`, { error: error.message });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }
};
var retry_manager_default = RetryManager;
export {
  MODULE_ID,
  RetryManager,
  VERSION,
  retry_manager_default as default,
  setLogger
};
