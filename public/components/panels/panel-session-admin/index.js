import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import * as Lifecycle from "./core/lifecycle.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin";
const getVersion = () => VERSION;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  return auth?.isAuthenticated?.() ?? false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let _instance = null;
class PanelSessionAdmin {
  constructor() {
    this._contentEl = null;
    this._mounted = false;
    this._config = {};
  }
  mount(contentEl, config = {}) {
    _initPorts();
    const logger = _getPort("logger");
    if (!contentEl) {
      logger?.error?.(`[${MODULE_ID}] Container n\xE3o fornecido`);
      return Promise.resolve(this);
    }
    this._contentEl = contentEl;
    this._config = config;
    return Lifecycle.mount(contentEl, config).then((result) => {
      if (!result.ok && result.error !== "AUTH_REQUIRED") {
        this._renderError(result.error || "Falha na inicializa\xE7\xE3o");
        return this;
      }
      this._mounted = true;
      logger?.debug?.(`[${MODULE_ID}] Mounted successfully`);
      return this;
    }).catch((error) => {
      logger?.error?.(`[${MODULE_ID}] Mount error:`, error);
      this._renderError(error.message || "Erro desconhecido");
      return this;
    });
  }
  _renderError(message) {
    if (!this._contentEl) return;
    this._contentEl.innerHTML = `<div class="psa-error-container" style="display: flex;flex-direction: column;align-items: center;justify-content: center;padding: 3rem 2rem;text-align: center;color: #F87171;background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02));border: 1px solid rgba(239,68,68,0.2);border-radius: 12px;margin: 1rem;"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1.25rem; opacity: 0.8;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg><h3 style="margin: 0 0 0.625rem; font-size: 1.125rem; font-weight: 600; color: #fff;">Erro ao carregar Sess\xF5es</h3><p style="margin: 0 0 1.25rem; opacity: 0.7; font-size: 0.875rem; max-width: 400px; line-height: 1.5;">${this._escapeHtml(message)}</p><button onclick="location.reload()" style="display: inline-flex;align-items: center;gap: 0.5rem;padding: 0.625rem 1.25rem;background: linear-gradient(135deg, #EF4444, #DC2626);color: white;border: none;border-radius: 8px;font-size: 0.875rem;font-weight: 500;cursor: pointer;transition: all 0.15s ease;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>Tentar novamente</button></div>`;
  }
  _escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  unmount() {
    const logger = _getPort("logger");
    if (!this._mounted) return Promise.resolve();
    Lifecycle.unmount();
    if (this._contentEl) this._contentEl.innerHTML = "";
    this._contentEl = null;
    this._mounted = false;
    this._config = {};
    logger?.debug?.(`[${MODULE_ID}] Unmounted`);
    return Promise.resolve();
  }
  refresh() {
    return Lifecycle.refresh();
  }
  isMounted() {
    return this._mounted;
  }
  healthCheck() {
    return {
      status: this._mounted ? "HEALTHY" : "DEGRADED",
      panelMounted: this._mounted,
      lifecycle: Lifecycle.healthCheck(),
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: Ports.isInitialized(),
      p22Compliant: true,
      timestamp: Date.now()
    };
  }
  getVersion() {
    return VERSION;
  }
}
const createPanel = () => {
  if (!_instance) _instance = new PanelSessionAdmin();
  return _instance;
};
const mount = (contentEl, config = {}) => {
  if (!_isAuthenticated()) {
    return Promise.resolve({ success: false, moduleId: MODULE_ID, error: "not-authenticated" });
  }
  const panel = createPanel();
  return panel.mount(contentEl, config);
};
const unmount = () => {
  if (_instance) return _instance.unmount().then(
    () => {
      _instance = null;
    }
  );
  return Promise.resolve();
};
const refresh = () => {
  if (!_isDocumentVisible()) return Promise.resolve();
  if (_instance) return _instance.refresh();
  return Promise.resolve({ ok: false, error: "NOT_MOUNTED" });
};
const healthCheck = () => {
  if (_instance) return _instance.healthCheck();
  return { status: "DEGRADED", panelMounted: false, lifecycle: Lifecycle.healthCheck(), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), p22Compliant: true, isDocumentVisible: _isDocumentVisible(), timestamp: Date.now() };
};
const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  mounted: _instance ? _instance.isMounted() : false,
  portsInitialized: Ports.isInitialized(),
  p22Compliant: true,
  features: ["Session management", "Terminate single session", "Terminate all other sessions", "Real-time status", "Filter by status", "Search sessions", "Admin multi-user view", "WCAG 2.1 AAA accessibility", "Dark theme optimized"]
});
if (typeof window !== "undefined") {
  if (!isStrict()) {
    window.PanelSessionAdmin = { PanelSessionAdmin, createPanel, mount, unmount, refresh, healthCheck, info, getVersion, injectPorts, getPorts, VERSION, MODULE_ID };
    _initPorts();
    const cfg = _getPort("config");
    if (cfg?.app?.debug) {
      window.__dev = window.__dev || {};
      window.__dev.PanelSessionAdmin = window.PanelSessionAdmin;
    }
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, property: "(window as any).PanelSessionAdmin" });
  }
}
const destroy = () => unmount();
var panel_session_admin_default = { PanelSessionAdmin, createPanel, mount, unmount, destroy, refresh, healthCheck, info, getVersion, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PanelSessionAdmin,
  VERSION,
  createPanel,
  panel_session_admin_default as default,
  destroy,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  refresh,
  unmount
};
