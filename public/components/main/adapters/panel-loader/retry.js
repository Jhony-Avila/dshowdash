const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "retry-backoff";
let _metrics = { attempts: 0, successes: 0, failures: 0 };
async function retryWithBackoff(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 500, maxDelay = 5e3, onRetry = null } = options;
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      _metrics.attempts++;
      const result = await fn();
      _metrics.successes++;
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        if (onRetry) onRetry({ attempt: attempt + 1, maxRetries, delay, error });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  _metrics.failures++;
  throw lastError;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { retryReady: true }, metrics: getMetrics() };
}
var retry_default = { retryWithBackoff, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  retry_default as default,
  getMetrics,
  healthCheck,
  info,
  retryWithBackoff
};
