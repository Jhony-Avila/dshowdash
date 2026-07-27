const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "_shared/api/fetch-base";
function createModuleFetch(moduleId) {
  const MODULE_ID2 = moduleId;
  const _config = {
    baseUrl: "",
    timeout: 3e4,
    retries: 0,
    retryDelay: 1e3
  };
  let _metrics = { requestCount: 0, successCount: 0, errorCount: 0, abortCount: 0, timeoutCount: 0, retryCount: 0, lastRequestAt: null };
  async function request(method, url, options = {}) {
    const timeoutMs = options.timeoutMs || options.timeout || _config.timeout;
    const maxRetries = options.retries !== void 0 ? options.retries : _config.retries;
    const retryDelay = options.retryDelayMs || options.retryDelay || _config.retryDelay;
    let lastError = null;
    for (let attempt = 0; attempt <= Number(maxRetries); attempt++) {
      let controller = null;
      let timeoutId = null;
      let signal = options.signal || null;
      if (!signal) {
        controller = new AbortController();
        signal = controller.signal;
        timeoutId = setTimeout(() => controller.abort(), Number(timeoutMs));
      }
      _metrics.requestCount++;
      _metrics.lastRequestAt = Date.now();
      const timestamp = Date.now();
      try {
        const fetchOptions = { method, signal, headers: { "Content-Type": "application/json", ...options.headers } };
        if (options.credentials) fetchOptions.credentials = options.credentials;
        if (options.body) fetchOptions.body = options.body;
        const response = await fetch(url, fetchOptions);
        if (timeoutId) clearTimeout(timeoutId);
        const statusCode = response.status;
        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          _metrics.errorCount++;
          return { ok: false, error: "HTTP " + statusCode + ": " + errorText, statusCode, aborted: false, timeout: false, retryCount: attempt, timestamp, moduleId: MODULE_ID2, version: VERSION };
        }
        const data = await response.json();
        _metrics.successCount++;
        return { ok: true, data, statusCode, aborted: false, timeout: false, retryCount: attempt, timestamp, moduleId: MODULE_ID2, version: VERSION };
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = error;
        const isAbort = error.name === "AbortError";
        const isTimeout = isAbort && !!controller;
        if (isTimeout) _metrics.timeoutCount++;
        if (isAbort) {
          _metrics.abortCount++;
          _metrics.errorCount++;
          return { ok: false, error: isTimeout ? "TIMEOUT" : "ABORTED", aborted: true, timeout: isTimeout, retryCount: attempt, timestamp, moduleId: MODULE_ID2, version: VERSION };
        }
        if (attempt < Number(maxRetries)) {
          _metrics.retryCount++;
          await new Promise(function(r) {
            setTimeout(r, Number(retryDelay) * (attempt + 1));
          });
          continue;
        }
        _metrics.errorCount++;
        return { ok: false, error: error.message, aborted: false, timeout: false, retryCount: attempt, timestamp, moduleId: MODULE_ID2, version: VERSION };
      }
    }
    _metrics.errorCount++;
    return { ok: false, error: lastError ? lastError.message : "UNKNOWN", aborted: false, timeout: false, timestamp: Date.now(), moduleId: MODULE_ID2, version: VERSION };
  }
  async function get(url, options = {}) {
    return request("GET", url, options);
  }
  async function post(url, data, options = {}) {
    return request("POST", url, { ...options, body: JSON.stringify(data) });
  }
  function configure(config) {
    Object.assign(_config, config);
  }
  function healthCheck() {
    return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID2, config: _config, metrics: _metrics };
  }
  function info() {
    return { version: VERSION, moduleId: MODULE_ID2, config: _config, metrics: _metrics, healthCheck: healthCheck() };
  }
  function getMetrics() {
    return { ..._metrics };
  }
  function resetMetrics() {
    _metrics = { requestCount: 0, successCount: 0, errorCount: 0, abortCount: 0, timeoutCount: 0, retryCount: 0, lastRequestAt: null };
  }
  return { request, get, post, configure, healthCheck, info, getMetrics, resetMetrics, MODULE_ID: MODULE_ID2, VERSION };
}
export {
  MODULE_ID,
  VERSION,
  createModuleFetch
};
