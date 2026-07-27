import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "header.whatsapp-integration.api.fetch";
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
  if (logger && logger[level]) logger[level].apply(logger, [`[${MODULE_ID}]`].concat(args));
}
function _debug() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug || false;
}
function _createFallback(reason) {
  return {
    status: "unavailable",
    configured: false,
    unread_count: 0,
    message: "Indispon\xEDvel no momento",
    integration: "whatsapp",
    _fallback: true,
    _fallback_reason: reason
  };
}
function _isAbortError(error) {
  if (!error) return false;
  if (error.name === "AbortError") return true;
  const msg = String(error.message || "").toLowerCase();
  return msg.indexOf("aborted") !== -1 || msg.indexOf("abort") !== -1;
}
function IntegrationAPI(endpoint) {
  this.endpoint = endpoint || "/api/integrations/whatsapp/status.php";
  this.timeout = 12e3;
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}
IntegrationAPI.prototype.fetchStatus = function() {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, self.timeout);
  return fetch(self.endpoint, {
    signal: controller.signal,
    headers: { "Content-Type": "application/json" }
  }).then((response) => {
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then((data) => {
    if (!data.ok) throw new Error(data.error || "API_ERROR");
    self._metrics.successCount++;
    return data.data;
  }).catch((error) => {
    clearTimeout(timeoutId);
    self._metrics.errorCount++;
    if (_isAbortError(error)) {
      _log("warn", "Fetch aborted (non-fatal)", { timeout: self.timeout });
      return _createFallback("timeout");
    }
    _log("error", "Fetch failed (non-fatal)", { error: error.message });
    return _createFallback("error");
  });
};
IntegrationAPI.prototype.healthCheck = function() {
  const checks = {
    hasEndpoint: !!this.endpoint,
    goodSuccessRate: this._metrics.requestCount === 0 || this._metrics.successCount / this._metrics.requestCount > 0.5,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 3 ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: 3,
    scoreDisplay: `${passed}/3`,
    checks,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
IntegrationAPI.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    endpoint: this.endpoint,
    metrics: this._metrics,
    portsInitialized: Ports.isInitialized(),
    healthCheck: this.healthCheck()
  };
};
IntegrationAPI.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
IntegrationAPI.prototype.resetMetrics = function() {
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
};
function getVersion() {
  return VERSION;
}
function destroy() {
}
var fetch_default = IntegrationAPI;
export {
  IntegrationAPI,
  MODULE_ID,
  VERSION,
  fetch_default as default,
  getPorts,
  getVersion,
  injectPorts
};
