import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS, AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-08.adapters.backend-api";
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
const API_BASE = "/api/modules/panels/panel-08";
const DEFAULT_TIMEOUT = 1e4;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1e3;
const metrics = { requests: 0, success: 0, errors: 0, authFails: 0, avgResponseTime: 0, responseTimes: [] };
function _emit(event, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(event, Object.assign({}, data || {}, { source: MODULE_ID, timestamp: Date.now() }));
}
function _isAuthenticated() {
  const auth = _getPort("auth");
  return auth && auth.isAuthenticated ? auth.isAuthenticated() : false;
}
function fetchWithTimeout(url, options, timeout) {
  timeout = timeout || DEFAULT_TIMEOUT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  options = options || {};
  if (!options.signal) options.signal = controller.signal;
  return fetch(url, options).then((response) => {
    clearTimeout(timeoutId);
    return response;
  }).catch((err) => {
    clearTimeout(timeoutId);
    throw err;
  });
}
function fetchWithRetry(url, options, retries) {
  retries = retries != null ? retries : MAX_RETRIES;
  let lastError;
  function attempt(i) {
    return fetchWithTimeout(url, options, options && options.timeout ? options.timeout : DEFAULT_TIMEOUT).catch((error) => {
      lastError = error;
      if (error.name === "AbortError") throw error;
      if (i < retries) {
        return new Promise((r) => {
          setTimeout(r, RETRY_DELAY * (i + 1));
        }).then(() => attempt(i + 1));
      }
      throw lastError;
    });
  }
  return attempt(0);
}
function loadAlerts(options = {}) {
  _initPorts();
  options = options || {};
  if (!_isAuthenticated()) {
    metrics.authFails++;
    _emit(AUTH_INTENTS.LOGIN, { reason: "session-expired" });
    return Promise.resolve({ ok: false, error: "AUTH_REQUIRED" });
  }
  const startTime = Date.now();
  metrics.requests++;
  return fetchWithRetry(`${API_BASE}/api.php`, { method: "GET", credentials: "include", headers: { "Content-Type": "application/json", "X-Panel-Id": "panel-08" }, signal: options.signal, timeout: options.timeout || DEFAULT_TIMEOUT }, MAX_RETRIES).then((response) => {
    if (response.status === 401) {
      metrics.authFails++;
      _emit(AUTH_EVENTS.SESSION_EXPIRED);
      return { ok: false, error: "AUTH_REQUIRED" };
    }
    if (!response.ok) {
      metrics.errors++;
      return { ok: false, error: `HTTP_${response.status}` };
    }
    return response.json().then((data) => {
      const duration = Date.now() - startTime;
      metrics.success++;
      metrics.responseTimes.push(duration);
      if (metrics.responseTimes.length > 20) metrics.responseTimes.shift();
      metrics.avgResponseTime = Math.round(metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length);
      return { ok: true, data: data.data || [], meta: data.meta || {}, duration };
    });
  }).catch((error) => {
    metrics.errors++;
    if (error.name === "AbortError") return { ok: false, error: "ABORTED" };
    return { ok: false, error: "NETWORK_ERROR", message: error.message };
  });
}
function acknowledgeAlert(alertId, options = {}) {
  _initPorts();
  options = options || {};
  if (!_isAuthenticated()) return Promise.resolve({ ok: false, error: "AUTH_REQUIRED" });
  return fetchWithTimeout(`${API_BASE}/api.php?action=acknowledge&id=${alertId}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, signal: options.signal }, DEFAULT_TIMEOUT).then((response) => {
    if (!response.ok) return { ok: false, error: `HTTP_${response.status}` };
    return { ok: true };
  }).catch((error) => ({
    ok: false,
    error: error.message
  }));
}
function getMetrics() {
  return Object.assign({}, metrics);
}
function resetMetrics() {
  metrics.requests = 0;
  metrics.success = 0;
  metrics.errors = 0;
  metrics.authFails = 0;
  metrics.avgResponseTime = 0;
  metrics.responseTimes = [];
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
var backend_api_default = { VERSION, MODULE_ID, loadAlerts, acknowledgeAlert, getMetrics, resetMetrics, getVersion, injectPorts, getPorts, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  acknowledgeAlert,
  backend_api_default as default,
  getMetrics,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  loadAlerts,
  resetMetrics
};
