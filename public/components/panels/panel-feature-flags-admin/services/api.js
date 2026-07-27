import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { API_BASE, PANEL_ID } from "../core/constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-feature-flags-admin/services/api";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
class ApiClient {
  constructor(logger) {
    this.logger = logger;
    this.activeController = null;
    _initPorts();
  }
  async request(endpoint, options = {}) {
    const { method = "GET", body, signal, timeout = 1e4 } = options;
    const controller = signal ? null : new AbortController();
    const abortSignal = signal || controller?.signal;
    if (!signal) this.activeController = controller;
    const timeoutId = setTimeout(() => controller?.abort(), Number(timeout));
    const url = `${API_BASE}/${endpoint}`;
    try {
      const res = await fetch(url, { method, signal: abortSignal, credentials: "include", headers: { "Content-Type": "application/json", "X-Panel-Id": PANEL_ID }, body: body ? JSON.stringify(body) : void 0 });
      clearTimeout(timeoutId);
      if (res.status === 401) {
        this.logger?.warn?.("api.auth-expired");
        _getPort("eventBus")?.emit?.(AUTH_EVENTS.SESSION_EXPIRED, { source: MODULE_ID });
        return { success: false, error: "HTTP_401", message: "Sess\xE3o expirada" };
      }
      if (res.status === 403) return { success: false, error: "HTTP_403", message: "Acesso negado" };
      if (!res.ok) return { success: false, error: `HTTP_${res.status}`, message: `Erro HTTP: ${res.status}` };
      const data = await res.json();
      if (data.ok === false) return { success: false, error: data.error || "REQUEST_ERROR", message: data.message || "Erro na requisi\xE7\xE3o" };
      this.logger?.debug?.("api.request-success", { url });
      return { success: true, payload: data };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") return { success: false, error: "REQUEST_ABORTED", message: "Requisi\xE7\xE3o cancelada" };
      this.logger?.error?.("api.request-error", { url, error: error.message });
      return { success: false, error: "NETWORK_ERROR", message: error.message };
    } finally {
      if (controller) this.activeController = null;
    }
  }
  fetchFlags(options) {
    return this.request("?action=all", options);
  }
  toggleFlag(flagKey, options) {
    return this.request(`?action=toggle&flag=${encodeURIComponent(flagKey)}`, { method: "PUT", ...options });
  }
  createFlag(flagData, options) {
    return this.request("?action=create", { method: "POST", body: flagData, ...options });
  }
  updateFlag(flagKey, flagData, options) {
    return this.request(`?action=update&flag=${encodeURIComponent(flagKey)}`, { method: "PUT", body: flagData, ...options });
  }
  deleteFlag(flagKey, options) {
    return this.request(`?action=delete&flag=${encodeURIComponent(flagKey)}`, { method: "DELETE", ...options });
  }
  cancel() {
    this.activeController?.abort();
    this.activeController = null;
  }
}
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { apiReady: true, portsInitialized: Ports.snapshot()._initialized } });
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
