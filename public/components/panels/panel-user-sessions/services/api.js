import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-user-sessions/services/api";
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
class ApiService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "/api/user/sessions";
    this._metrics = { requestCount: 0, errorCount: 0, lastRequestAt: null };
  }
  async fetch(endpoint, options = {}) {
    this._metrics.requestCount++;
    this._metrics.lastRequestAt = Date.now();
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      this._metrics.errorCount++;
      _getPort("logger")?.error(`[${MODULE_ID}] API error:`, e);
      throw e;
    }
  }
  async getAll() {
    return this.fetch("/");
  }
  async revoke(id) {
    return this.fetch(`/${id}`, { method: "DELETE" });
  }
  async revokeAll() {
    return this.fetch("/all", { method: "DELETE" });
  }
  healthCheck() {
    return { status: "healthy", portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, baseUrl: this.baseUrl, metrics: this._metrics, portsInitialized: Ports.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
}
var api_default = ApiService;
export {
  ApiService,
  MODULE_ID,
  VERSION,
  api_default as default,
  getPorts,
  injectPorts
};
