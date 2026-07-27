import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS, AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
const MODULE_ID = "panel-04.services.api";
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
function ApiClient(panelId, options = {}) {
  if (options === void 0) options = {};
  this.panelId = panelId;
  this.logger = options.logger || options;
  this.debug = options.debug || (() => false);
  this.activeController = null;
  this.baseURL = "/api/modules/panels";
  this._metrics = { fetchCount: 0, successCount: 0, errorCount: 0, authFailCount: 0, avgResponseTime: 0, lastResponseTime: 0 };
}
ApiClient.prototype._log = function(level, action, data = {}) {
  if (level === "debug" && !this.debug()) return;
  if (this.logger && this.logger.info) {
    const fn = this.logger[level] || this.logger.info;
    if (typeof fn === "function") fn.call(this.logger, action, data);
  }
};
ApiClient.prototype._isAuthenticated = () => {
  const auth = _getPort("auth");
  return auth && auth.isAuthenticated ? auth.isAuthenticated() : false;
};
ApiClient.prototype._emit = function(eventName, data = {}) {
  _initPorts();
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(eventName, Object.assign({}, data, { source: this.panelId, timestamp: Date.now() }));
  }
};
ApiClient.prototype._emitAuthRequired = function() {
  this._metrics.authFailCount++;
  this._emit(AUTH_INTENTS.LOGIN, { reason: "session-expired" });
};
ApiClient.prototype._updateMetrics = function(responseTime, success) {
  this._metrics.lastResponseTime = responseTime;
  const total = this._metrics.successCount + this._metrics.errorCount;
  if (total > 0) {
    this._metrics.avgResponseTime = (this._metrics.avgResponseTime * (total - 1) + responseTime) / total;
  }
};
ApiClient.prototype.fetchData = function(options = {}) {
  const self = this;
  if (options === void 0) options = {};
  if (!this._isAuthenticated()) {
    this._emitAuthRequired();
    return Promise.resolve({ success: false, error: "AUTH_REQUIRED", message: "Sess\xE3o expirada" });
  }
  const signal = options.signal;
  const timeout = options.timeout || 15e3;
  const period = options.period || "24h";
  const startTime = performance.now();
  const controller = signal ? null : new AbortController();
  const abortSignal = signal || (controller ? controller.signal : null);
  if (!signal) this.activeController = controller;
  const timeoutId = setTimeout(() => {
    if (controller) {
      controller.abort();
      self._log("warn", "api.timeout", { timeout });
    }
  }, timeout);
  const url = `${this.baseURL}/${this.panelId}/api.php?period=${encodeURIComponent(period)}`;
  this._metrics.fetchCount++;
  self._log("debug", "api.fetch-start", { url, period });
  return fetch(url, { method: "GET", signal: abortSignal, credentials: "include", headers: { "Content-Type": "application/json", "X-Panel-Id": this.panelId, "X-Request-Time": Date.now().toString() } }).then((response) => {
    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;
    if (response.status === 401) {
      self._metrics.authFailCount++;
      self._emit(AUTH_EVENTS.SESSION_EXPIRED);
      return { success: false, error: "AUTH_REQUIRED", message: "Sess\xE3o expirada" };
    }
    if (!response.ok) {
      self._metrics.errorCount++;
      self._log("warn", "api.http-error", { status: response.status });
      return { success: false, error: `HTTP_${response.status}`, message: `Erro HTTP: ${response.status}` };
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
      self._metrics.errorCount++;
      self._log("error", "api.invalid-content-type", { contentType });
      return { success: false, error: "INVALID_CONTENT_TYPE", message: "Resposta n\xE3o \xE9 JSON" };
    }
    return response.json().then((data) => {
      self._metrics.successCount++;
      self._updateMetrics(responseTime, true);
      self._log("debug", "api.fetch-success", { responseTime: `${responseTime.toFixed(2)}ms`, dataSize: JSON.stringify(data).length });
      return { success: true, payload: data, meta: { responseTime, period } };
    });
  }).catch((error) => {
    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;
    if (error.name === "AbortError") {
      self._log("debug", "api.aborted");
      return { success: false, error: "REQUEST_ABORTED", message: "Requisi\xE7\xE3o cancelada" };
    }
    self._metrics.errorCount++;
    self._updateMetrics(responseTime, false);
    self._log("error", "api.fetch-error", { error: error.message, responseTime: `${responseTime.toFixed(2)}ms` });
    return { success: false, error: "NETWORK_ERROR", message: error.message || "Erro de rede" };
  }).finally(() => {
    if (controller) self.activeController = null;
  });
};
ApiClient.prototype.cancel = function() {
  if (this.activeController) {
    this._log("debug", "api.cancel");
    this.activeController.abort();
    this.activeController = null;
  }
};
ApiClient.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, { successRate: this._metrics.fetchCount > 0 ? `${(this._metrics.successCount / this._metrics.fetchCount * 100).toFixed(1)}%` : "100%" });
};
ApiClient.prototype.reset = function() {
  this.cancel();
  this._metrics = { fetchCount: 0, successCount: 0, errorCount: 0, authFailCount: 0, avgResponseTime: 0, lastResponseTime: 0 };
  this._log("debug", "api.reset");
};
ApiClient.prototype.healthCheck = function() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, metrics: this.getMetrics(), hasActiveRequest: !!this.activeController };
};
ApiClient.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, baseURL: this.baseURL };
};
var api_default = ApiClient;
export {
  ApiClient,
  MODULE_ID,
  VERSION,
  api_default as default,
  getPorts,
  injectPorts
};
