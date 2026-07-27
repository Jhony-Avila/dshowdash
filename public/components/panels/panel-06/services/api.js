import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
const MODULE_ID = "panel-06.services.api";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
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
  return auth?.isAuthenticated ? auth.isAuthenticated() : false;
};
ApiClient.prototype._emit = function(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb?.emit) eb.emit(eventName, { ...data || {}, source: this.panelId, timestamp: Date.now() });
};
ApiClient.prototype._emitAuthRequired = function() {
  this._metrics.authFailCount++;
  this._emit(AUTH_INTENTS.LOGIN, { reason: "session-expired" });
};
ApiClient.prototype.fetchData = function(options = {}) {
  if (!this._isAuthenticated()) {
    this._emitAuthRequired();
    return Promise.resolve({ success: false, error: "AUTH_REQUIRED", message: "Sess\xE3o expirada" });
  }
  const signal = options.signal;
  const controller = signal ? null : new AbortController();
  const abortSignal = signal || controller?.signal;
  this._metrics.fetchCount++;
  const url = String(options.url || `${this.baseURL}/${this.panelId}/data`);
  const fetchOptions = { method: options.method || "GET", headers: { "Content-Type": "application/json", ...options.headers || {} }, signal: abortSignal };
  if (options.body) fetchOptions.body = JSON.stringify(options.body);
  return fetch(url, fetchOptions).then((response) => {
    if (!response.ok) {
      if (response.status === 401) {
        this._emitAuthRequired();
        return { success: false, error: "AUTH_REQUIRED" };
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }).then((data) => {
    this._metrics.successCount++;
    return { success: true, data };
  }).catch((error) => {
    this._metrics.errorCount++;
    if (this.logger) this.logger.error("fetchData", { error: error.message });
    return { success: false, error: error.message };
  });
};
ApiClient.prototype.getMetrics = function() {
  return { ...this._metrics };
};
ApiClient.prototype.abort = function() {
  if (this.activeController) {
    this.activeController.abort();
    this.activeController = null;
  }
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
var api_default = ApiClient;
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
