import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS, AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
const MODULE_ID = "panel-09.services.api";
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
function ApiClient(panelId, logger) {
  this.panelId = panelId;
  this.logger = logger;
  this.activeController = null;
  this.baseURL = "/api/modules/panels";
  this._metrics = { fetchCount: 0, successCount: 0, errorCount: 0, authFailCount: 0 };
  _initPorts();
}
ApiClient.prototype._isAuthenticated = () => {
  const auth = _getPort("auth");
  return auth?.isAuthenticated?.() || false;
};
ApiClient.prototype._emit = function(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb?.emit) eb.emit(eventName, Object.assign({}, data || {}, { source: this.panelId, timestamp: Date.now() }));
};
ApiClient.prototype._emitAuthRequired = function() {
  this._metrics.authFailCount++;
  this._emit(AUTH_INTENTS.LOGIN, { reason: "session-expired" });
};
ApiClient.prototype.fetchData = function(options) {
  const self = this;
  options = options || {};
  if (!this._isAuthenticated()) {
    this._emitAuthRequired();
    return Promise.resolve({ success: false, error: "AUTH_REQUIRED", message: "Sess\xE3o expirada" });
  }
  const signal = options.signal;
  const controller = signal ? null : new AbortController();
  const abortSignal = signal || controller?.signal;
  if (!signal) this.activeController = controller;
  const url = `${this.baseURL}/${this.panelId}/api.php`;
  this._metrics.fetchCount++;
  return fetch(url, { signal: abortSignal, credentials: "include", headers: { "Content-Type": "application/json", "X-Panel-Id": this.panelId } }).then((response) => {
    if (response.status === 401) {
      self._metrics.authFailCount++;
      self._emit(AUTH_EVENTS.SESSION_EXPIRED);
      return { success: false, error: "AUTH_REQUIRED", message: "Sess\xE3o expirada" };
    }
    if (!response.ok) {
      self._metrics.errorCount++;
      return { success: false, error: `HTTP_${response.status}` };
    }
    return response.json().then((data) => {
      self._metrics.successCount++;
      return { success: true, payload: data };
    });
  }).catch((error) => {
    if (error.name === "AbortError") return { success: false, error: "REQUEST_ABORTED" };
    self._metrics.errorCount++;
    return { success: false, error: "NETWORK_ERROR", message: error.message };
  });
};
ApiClient.prototype.cancel = function() {
  if (this.activeController) {
    this.activeController.abort();
    this.activeController = null;
  }
};
ApiClient.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
var api_default = ApiClient;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { apiReady: true } };
}
export {
  ApiClient,
  MODULE_ID,
  VERSION,
  api_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
