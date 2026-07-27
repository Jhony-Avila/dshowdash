import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import * as Lifecycle from "./core/lifecycle.js";
const VERSION = "9.3.23-RECONNECT";
const MODULE_ID = "panels/panel-user-management";
const getVersion = () => VERSION;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => {
  Ports.inject(p);
  try {
    Lifecycle.injectPorts?.(p);
  } catch (_e) {
  }
  return Ports.snapshot();
};
const getPorts = () => Ports.snapshot();
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  if (auth?.isAuthenticated?.()) return true;
  if (typeof window === "undefined") return false;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const sm = window.Core.windowAdapter.get("SessionManager");
    if (sm?.isAuthenticated?.()) return true;
  }
  if (strictMode) return false;
  if (window.SessionManager?.isAuthenticated?.()) {
    recordViolation("WINDOW_SESSIONMANAGER_FALLBACK", { module: MODULE_ID, method: "_isAuthenticated" });
    return true;
  }
  return false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const CSS_ID = "pum-styles";
const CSS_PATH = "/components/panels/panel-user-management/styles/index.css";
let _cssLoaded = false;
const _loadCSS = () => {
  if (typeof document === "undefined") return;
  if (_cssLoaded) return;
  if (document.getElementById(CSS_ID) || document.querySelector('link[href*="panel-user-management/styles"]')) {
    _cssLoaded = true;
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_PATH;
  link.id = CSS_ID;
  document.head.appendChild(link);
  _cssLoaded = true;
};
class UserManagementComponent {
  constructor(options = {}) {
    _initPorts();
    this.container = options.container || null;
    this.eventBus = options.eventBus || _getPort("eventBus");
    this._mounted = false;
    this._initialized = false;
    this._metrics = { mountCount: 0, errorCount: 0 };
  }
  init(ctx) {
    if (this._initialized) return this;
    this._ctx = ctx || {};
    this._initialized = true;
    return this;
  }
  mount(container, _config = {}) {
    _initPorts();
    const logger = _getPort("logger");
    this.container = container || this.container;
    if (!this.container) {
      logger?.error?.(`[${MODULE_ID}] Container n\xE3o fornecido`);
      return Promise.resolve(this);
    }
    if (!_isAuthenticated()) {
      this.container.innerHTML = '<div style="padding:2rem;text-align:center;color:#F59E0B;">Fa\xE7a login para acessar</div>';
      return Promise.resolve(this);
    }
    _loadCSS();
    try {
      // Re-mount limpo: o host (orquestrador) NÃO desmonta o painel ao trocar de rota,
      // então o guarda `_mounted` do lifecycle bloquearia a 2ª montagem ("estado preso",
      // main vazio ao voltar). unmount() é idempotente (no-op se não montado).
      try { Lifecycle.unmount(); } catch (_u) {}
      const ok = Lifecycle.mount(this.container, {});
      this._mounted = ok !== false;
      this._metrics.mountCount++;
      logger?.debug?.(`[${MODULE_ID}] Mounted (lifecycle=${ok})`);
      this.eventBus?.emit?.("component:mounted", { moduleId: MODULE_ID, timestamp: Date.now() });
    } catch (e) {
      this._metrics.errorCount++;
      logger?.error?.(`[${MODULE_ID}] Mount error:`, e);
      this._renderError(e?.message || "Erro desconhecido");
    }
    return Promise.resolve(this);
  }
  _renderError(message) {
    if (!this.container) return;
    this.container.innerHTML = `<div class="pum-error-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 2rem;text-align:center;color:#F87171;background:linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.02));border:1px solid rgba(239,68,68,0.2);border-radius:12px;margin:1rem;"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1.25rem;opacity:0.8;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg><h3 style="margin:0 0 0.625rem;font-size:1.125rem;font-weight:600;">Erro ao carregar Gest\xE3o de Usu\xE1rios</h3><p style="margin:0 0 1.25rem;opacity:0.7;font-size:0.875rem;max-width:400px;line-height:1.5;">${this._escapeHtml(message)}</p><button onclick="location.reload()" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.625rem 1.25rem;background:linear-gradient(135deg,#EF4444,#DC2626);color:white;border:none;border-radius:8px;font-size:0.875rem;font-weight:500;cursor:pointer;">Tentar novamente</button></div>`;
  }
  _escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str ?? "");
    return div.innerHTML;
  }
  unmount() {
    try {
      Lifecycle.unmount();
    } catch (_e) {
    }
    if (this.container) this.container.innerHTML = "";
    this._mounted = false;
    return Promise.resolve(this);
  }
  refresh() {
    if (!_isDocumentVisible()) return Promise.resolve();
    return Lifecycle.refresh();
  }
  isMounted() {
    return this._mounted;
  }
  healthCheck() {
    return {
      status: this._mounted ? "HEALTHY" : "DEGRADED",
      panelMounted: this._mounted,
      lifecycle: Lifecycle.healthCheck?.() ?? null,
      isAuthenticated: _isAuthenticated(),
      version: VERSION,
      moduleId: MODULE_ID,
      p22Compliant: true,
      timestamp: Date.now()
    };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, metrics: this._metrics, lifecycle: Lifecycle.info?.() ?? null };
  }
  getMetrics() {
    return { ...this._metrics };
  }
}
let _currentInstance = null;
const mount = (container, config) => {
  if (!_isAuthenticated()) {
    return Promise.resolve({ success: false, moduleId: MODULE_ID, error: "not-authenticated" });
  }
  if (!_currentInstance) _currentInstance = new UserManagementComponent({ container });
  _currentInstance.init();
  return _currentInstance.mount(container, config).then(() => ({ success: true, moduleId: MODULE_ID, instance: _currentInstance }));
};
const unmount = () => {
  if (_currentInstance) {
    const instance = _currentInstance;
    _currentInstance = null;
    return instance.unmount().then(() => ({ success: true, moduleId: MODULE_ID }));
  }
  return Promise.resolve({ success: true, moduleId: MODULE_ID });
};
const destroy = () => unmount();
const refresh = () => {
  if (_currentInstance) return _currentInstance.refresh();
  return Promise.resolve();
};
const healthCheck = () => _currentInstance?.healthCheck() ?? { status: "UNHEALTHY", mounted: false, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
var panel_user_management_default = { UserManagementComponent, mount, unmount, destroy, refresh, healthCheck, getVersion, MODULE_ID, VERSION, injectPorts, getPorts };
export {
  MODULE_ID,
  UserManagementComponent,
  VERSION,
  panel_user_management_default as default,
  destroy,
  getPorts,
  getVersion,
  healthCheck,
  injectPorts,
  mount,
  refresh,
  unmount
};
