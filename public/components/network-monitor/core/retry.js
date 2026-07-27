const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "network-monitor-retry";
let _metrics = { retries: 0, successes: 0, failures: 0 };
async function withRetry(fn, options = {}) {
  const { maxAttempts = 3, delay = 1e3, backoff = 2 } = options;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      _metrics.retries++;
      const result = await fn();
      _metrics.successes++;
      return result;
    } catch (e) {
      if (attempt === maxAttempts) {
        _metrics.failures++;
        throw e;
      }
      await new Promise((r) => setTimeout(r, delay * Math.pow(backoff, attempt - 1)));
    }
  }
}
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics = { retries: 0, successes: 0, failures: 0 };
}
function healthCheck() {
  const checks = { lowFailureRate: _metrics.retries === 0 || _metrics.failures / _metrics.retries < 0.3 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), timestamp: Date.now() };
}
var retry_default = { withRetry, getMetrics, resetMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  retry_default as default,
  getMetrics,
  healthCheck,
  info,
  resetMetrics,
  withRetry
};
