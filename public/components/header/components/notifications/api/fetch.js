import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.2.0-ES6";
const MODULE_ID = "header.notifications.api.fetch";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (logger && logger[level]) logger[level](...[`[${MODULE_ID}]`].concat(args));
}
function _trackTelemetry(event, data) {
  try {
    const telemetry = _getPort("telemetry");
    if (telemetry && telemetry.track) telemetry.track(`${MODULE_ID}:${event}`, data || {});
  } catch (e) {
  }
}
function _validateResponseContract(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.indexOf("application/json") !== -1;
  const isHtml = contentType.indexOf("text/html") !== -1;
  return {
    ok: response.ok,
    status: response.status,
    isJson,
    isHtml,
    contentType,
    isContractViolation: !isJson && response.ok,
    isAuthError: response.status === 401 || response.status === 403
  };
}
const SAFE_FALLBACK = Object.freeze({ unread_count: 0, _fallback: true, _reason: "unknown" });
function _createFallback(reason) {
  return { unread_count: 0, _fallback: true, _reason: reason };
}
function NotificationsAPI(options) {
  if (!options) options = {};
  this.baseURL = options.baseURL || "/api/notifications";
  this.timeout = options.timeout || 1e4;
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
}
NotificationsAPI.prototype.get = function(endpoint) {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, self.timeout);
  return fetch(self.baseURL + endpoint, { signal: controller.signal, credentials: "include" }).then((response) => {
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    self._metrics.successCount++;
    return response.json();
  }).catch((error) => {
    clearTimeout(timeoutId);
    self._metrics.errorCount++;
    const reason = error.name === "AbortError" ? "timeout" : "network-error";
    _log("warn", "Request failed (non-fatal), using fallback", { endpoint, reason, error: error.message });
    return _createFallback(reason);
  });
};
NotificationsAPI.prototype.fetchNotifications = function() {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, self.timeout);
  const url = `${self.baseURL}/?action=count`;
  return fetch(url, {
    signal: controller.signal,
    credentials: "include",
    headers: { "Accept": "application/json" }
  }).then((response) => {
    clearTimeout(timeoutId);
    const contract = _validateResponseContract(response);
    if (contract.isAuthError) {
      self._metrics.authErrors++;
      _log("info", "Auth required for notifications", { status: contract.status });
      _trackTelemetry("auth-required", { status: contract.status });
      return _createFallback("auth-required");
    }
    if (contract.isContractViolation) {
      self._metrics.contractViolations++;
      _log("error", `API_CONTRACT_VIOLATION: Expected JSON, got ${contract.contentType}`, { url, status: contract.status });
      _trackTelemetry("contract-violation", { contentType: contract.contentType, status: contract.status, url });
      return _createFallback("contract-violation");
    }
    if (!contract.ok && contract.isJson) {
      return response.json().then((errorData) => {
        _log("warn", "API returned error", { status: contract.status, error: errorData.error || "unknown" });
        return _createFallback("api-error");
      });
    }
    if (!contract.ok) {
      self._metrics.errorCount++;
      _log("error", "Request failed with non-JSON response", { status: contract.status, contentType: contract.contentType });
      return _createFallback("http-error");
    }
    self._metrics.successCount++;
    return response.json();
  }).then((data) => {
    if (data && data._fallback) return data;
    return { unread_count: data.unread_count || data.count || 0 };
  }).catch((error) => {
    clearTimeout(timeoutId);
    self._metrics.errorCount++;
    const reason = error.name === "AbortError" ? "timeout" : "network-error";
    _log("warn", "Fetch failed, using fallback", { error: error.message, reason });
    _trackTelemetry("fetch-error", { error: error.message, reason });
    return _createFallback(reason);
  });
};
NotificationsAPI.prototype.healthCheck = function() {
  const checks = {
    hasBaseURL: true,
    goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5,
    lowContractViolations: this._metrics.requestCount === 0 || this._metrics.contractViolations / this._metrics.requestCount < 0.1,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 4 ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: 4,
    scoreDisplay: `${passed}/4`,
    checks,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
NotificationsAPI.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    baseURL: this.baseURL,
    metrics: this._metrics,
    portsInitialized: Ports.isInitialized(),
    healthCheck: this.healthCheck()
  };
};
NotificationsAPI.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
NotificationsAPI.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
};
function getVersion() {
  return VERSION;
}
function destroy() {
}
var fetch_default = NotificationsAPI;
export {
  MODULE_ID,
  NotificationsAPI,
  VERSION,
  fetch_default as default,
  getPorts,
  getVersion,
  injectPorts
};
