const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-footer-settings/api/fetch";
const _config = {
  baseUrl: "",
  timeout: 3e4,
  retries: 3,
  retryDelay: 1e3
};
let _metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || _config.timeout);
  _metrics.requestCount++;
  _metrics.lastRequestAt = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers }
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    _metrics.successCount++;
    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    _metrics.errorCount++;
    throw error;
  }
}
async function get(url, options = {}) {
  return request(url, { ...options, method: "GET" });
}
async function post(url, data, options = {}) {
  return request(url, { ...options, method: "POST", body: JSON.stringify(data) });
}
function configure(config) {
  Object.assign(_config, config);
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID, config: _config, metrics: _metrics };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, config: _config, metrics: _metrics, healthCheck: healthCheck() };
}
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
var fetch_default = { request, get, post, configure, healthCheck, info, getMetrics, resetMetrics, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  configure,
  fetch_default as default,
  get,
  getMetrics,
  healthCheck,
  info,
  post,
  request,
  resetMetrics
};
