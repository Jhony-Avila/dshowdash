import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { SecurityCSRF } from "/components/security/csrf-token-manager/index.js";
const MODULE_ID = "panel-12.services.http";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const MAX_RETRIES = 3;
const RETRY_DELAY = 2e3;
function getCommonHeaders(includeContentType = false) {
  const securityHeaders = SecurityCSRF.getHeaders();
  const headers = { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest", ...securityHeaders };
  if (includeContentType) headers["Content-Type"] = "application/json";
  return headers;
}
async function request(url, options = {}, retryCount = 0) {
  const signal = options.signal || null;
  const startTime = Date.now();
  const method = options.method || "GET";
  const reqOptions = { credentials: "include", cache: "no-store", method, headers: { ...getCommonHeaders(method !== "GET"), ...options.headers || {} } };
  if (signal) reqOptions.signal = signal;
  if (options.body) reqOptions.body = options.body;
  try {
    const response = await fetch(url, reqOptions);
    const duration = Date.now() - startTime;
    if (response.status === 401 || response.status === 403) {
      SecurityCSRF.emitLoginRequired(response.status === 401 ? "api-401" : "api-403", { url, method: options.method || "GET", status: response.status });
      return { success: false, error: "SESSION_EXPIRED", status: response.status, duration };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) throw new Error("Invalid content-type (expected JSON)");
    const data = await response.json();
    if (!data || typeof data !== "object") throw new Error("Invalid response payload");
    return { success: true, data, status: response.status, duration };
  } catch (error) {
    if (error.name === "AbortError") return { success: false, error: "ABORTED", duration: Date.now() - startTime };
    const duration = Date.now() - startTime;
    if (retryCount < MAX_RETRIES && (!signal || !signal.aborted)) {
      const retryDelay = RETRY_DELAY * (retryCount + 1);
      await new Promise((r) => setTimeout(r, retryDelay));
      return request(url, { ...options, signal }, retryCount + 1);
    }
    return { success: false, error: error.message, duration, retriesExhausted: true };
  }
}
function get(url, options = {}) {
  return request(url, { method: "GET", ...options });
}
function post(url, body, options = {}) {
  return request(url, { method: "POST", body: JSON.stringify(body), ...options });
}
function put(url, body, options = {}) {
  return request(url, { method: "PUT", body: JSON.stringify(body), ...options });
}
function del(url, options = {}) {
  return request(url, { method: "DELETE", ...options });
}
function createAbortController() {
  return new AbortController();
}
function isSessionExpired(result) {
  return result.error === "SESSION_EXPIRED";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, securityCSRF: SecurityCSRF.isReady(), maxRetries: MAX_RETRIES, retryDelay: RETRY_DELAY, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { httpReady: true, portsInitialized: Ports.isInitialized() } };
}
export {
  MODULE_ID,
  VERSION,
  createAbortController,
  del,
  get,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isSessionExpired,
  post,
  put
};
