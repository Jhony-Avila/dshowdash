import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "header.email-integration.api.fetch";
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
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (logger && logger[level]) logger[level](...[`[${MODULE_ID}]`].concat(args));
};
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
function _createFallback(reason) {
  return { received_today: 0, unread: 0, status: "unavailable", _fallback: true, _reason: reason };
}
function IntegrationAPI(options) {
  if (!options) options = {};
  this.baseURL = options.baseURL || "/api/email";
  this.timeout = options.timeout || 1e4;
  this.headers = options.headers || {};
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
}
IntegrationAPI.prototype.get = function(endpoint, options) {
  return this._request("GET", endpoint, null, options || {});
};
IntegrationAPI.prototype.post = function(endpoint, data, options) {
  return this._request("POST", endpoint, data, options || {});
};
IntegrationAPI.prototype._request = function(method, endpoint, data, options) {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, self.timeout);
  const config = {
    method,
    headers: Object.assign({ "Accept": "application/json" }, self.headers, options.headers || {}),
    signal: controller.signal,
    credentials: "include"
  };
  if (data) {
    config.body = JSON.stringify(data);
    config.headers["Content-Type"] = "application/json";
  }
  const url = self.baseURL + endpoint;
  return fetch(url, config).then((response) => {
    clearTimeout(timeoutId);
    const contract = _validateResponseContract(response);
    if (contract.isAuthError) {
      self._metrics.authErrors++;
      _log("info", "Auth required", { status: contract.status });
      return _createFallback("auth-required");
    }
    if (contract.isContractViolation) {
      self._metrics.contractViolations++;
      _log("error", "API_CONTRACT_VIOLATION", { contentType: contract.contentType });
      _trackTelemetry("contract-violation", { contentType: contract.contentType });
      return _createFallback("contract-violation");
    }
    if (!response.ok) {
      self._metrics.errorCount++;
      return _createFallback("http-error");
    }
    self._metrics.successCount++;
    return response.json();
  }).catch((error) => {
    clearTimeout(timeoutId);
    self._metrics.errorCount++;
    _log("error", "Request failed", { method, endpoint, error: error.message });
    return _createFallback("network-error");
  });
};
IntegrationAPI.prototype.fetchStatus = function() {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, self.timeout);
  const url = "/api/outlook/header-counter";
  return fetch(url, {
    signal: controller.signal,
    credentials: "include",
    headers: { "Accept": "application/json" }
  }).then((response) => {
    clearTimeout(timeoutId);
    const contract = _validateResponseContract(response);
    if (contract.isAuthError) {
      self._metrics.authErrors++;
      _log("info", "Auth required for email status", { status: contract.status });
      return _createFallback("auth-required");
    }
    if (contract.isContractViolation) {
      self._metrics.contractViolations++;
      _log("error", `API_CONTRACT_VIOLATION: Expected JSON, got ${contract.contentType}`, { url });
      _trackTelemetry("contract-violation", { contentType: contract.contentType, url });
      return _createFallback("contract-violation");
    }
    if (!response.ok) {
      self._metrics.errorCount++;
      return _createFallback("http-error");
    }
    self._metrics.successCount++;
    return response.json();
  }).then((data) => {
    if (data && data._fallback) return data;
    const d = data && data.data ? data.data : data;
    return { received_today: d.received_today || 0, unread: d.unread || 0, updated_at: d.updated_at || null, status: "ok" };
  }).catch((error) => {
    clearTimeout(timeoutId);
    self._metrics.errorCount++;
    const reason = error.name === "AbortError" ? "timeout" : "network-error";
    _log("warn", "Fetch failed, using fallback", { error: error.message, reason });
    return _createFallback(reason);
  });
};
IntegrationAPI.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  const checks = {
    hasBaseURL: this.baseURL !== void 0,
    goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5,
    lowContractViolations: this._metrics.requestCount === 0 || this._metrics.contractViolations / this._metrics.requestCount < 0.1,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 4 ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: 4,
    scoreDisplay: `${passed}/4`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
IntegrationAPI.prototype.info = function() {
  const ps = Ports.snapshot();
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    baseURL: this.baseURL,
    metrics: this._metrics,
    portsInitialized: ps._initialized,
    healthCheck: this.healthCheck()
  };
};
IntegrationAPI.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
IntegrationAPI.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
};
function destroy() {
}
var fetch_default = IntegrationAPI;
export {
  IntegrationAPI,
  MODULE_ID,
  VERSION,
  fetch_default as default,
  getPorts,
  injectPorts
};
