import { createLogger } from "./logger.js";
const VERSION = "9.4.0-P2-ENTERPRISE";
const MODULE_ID = "footer-http-client";
const _log = createLogger(MODULE_ID);
const CONFIG = {
  retry: { maxAttempts: 3, baseDelay: 1e3, maxDelay: 5e3 },
  timeout: 1e4
};
let _abortController = null;
let _metrics = { requests: 0, retries: 0, errors: 0, aborts: 0 };
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchWithRetry(url, options = {}, attempt = 1) {
  _metrics.requests++;
  const { maxAttempts, baseDelay, maxDelay } = CONFIG.retry;
  if (!_abortController || _abortController.signal.aborted) {
    _abortController = new AbortController();
  }
  const fetchOptions = { ...options, signal: _abortController.signal };
  try {
    const timeoutId = setTimeout(() => _abortController.abort(), CONFIG.timeout);
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    if (!response.ok && attempt < maxAttempts) {
      _metrics.retries++;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      _log.warn(`Request failed (${response.status}), retry ${attempt}/${maxAttempts} in ${delay}ms`);
      await sleep(delay);
      return fetchWithRetry(url, options, attempt + 1);
    }
    return response;
  } catch (error) {
    if (error.name === "AbortError") {
      _metrics.aborts++;
      throw new Error("REQUEST_TIMEOUT");
    }
    if (attempt < maxAttempts) {
      _metrics.retries++;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      _log.warn(`Request error, retry ${attempt}/${maxAttempts} in ${delay}ms:`, error.message);
      await sleep(delay);
      _abortController = new AbortController();
      return fetchWithRetry(url, options, attempt + 1);
    }
    _metrics.errors++;
    throw error;
  }
}
function abortPendingRequests() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}
function getAbortController() {
  return _abortController;
}
function createAbortController() {
  _abortController = new AbortController();
  return _abortController;
}
function isAbortControllerActive() {
  return !!_abortController && !_abortController.signal.aborted;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: CONFIG, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { httpReady: true }, metrics: getMetrics() };
}
var http_client_default = { fetchWithRetry, abortPendingRequests, getAbortController, createAbortController, isAbortControllerActive, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  abortPendingRequests,
  createAbortController,
  http_client_default as default,
  fetchWithRetry,
  getAbortController,
  getMetrics,
  healthCheck,
  info,
  isAbortControllerActive
};
