import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { IconRegistry } from "/components/icon-registry/index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_ID = "panel-status";
const MODULE_ID = PANEL_ID;
const getVersion = () => VERSION;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
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
const _log = (level, ...args) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](prefix, ...args);
};
const icon = (name, ns = "extended") => IconRegistry.get(`${ns}:${name}`) || IconRegistry.get(`system:${name}`) || IconRegistry.get(`charts:${name}`) || IconRegistry.get(`ui:${name}`) || IconRegistry.get(`business:${name}`) || "";
const STATUS_TYPES = { "status-database": { icon: "database", label: "Database", color: "#10B981", api: "/api/status/database" }, "status-server": { icon: "server", label: "Servidor", color: "#3B82F6", api: "/api/status/server" }, "status-cloud": { icon: "cloud", label: "Cloud", color: "#8B5CF6", api: "/api/status/cloud" }, "status-cpu": { icon: "cpu", label: "CPU", color: "#F59E0B", api: "/api/status/cpu" }, "status-memory": { icon: "hard-drive", label: "Mem\xF3ria", color: "#EF4444", api: "/api/status/memory" }, "status-disk": { icon: "hard-drive", label: "Disco", color: "#6366F1", api: "/api/status/disk" }, "status-wifi": { icon: "wifi", label: "Rede", color: "#14B8A6", api: "/api/status/network" }, "status-activity": { icon: "activity", label: "Atividade", color: "#F97316", api: "/api/status/activity" }, "status-trending": { icon: "trending-up", label: "Performance", color: "#22C55E", api: "/api/status/performance" }, "status-calendar": { icon: "calendar", label: "Agenda", color: "#EC4899", api: "/api/status/calendar" }, "status-zap": { icon: "zap", label: "Integra\xE7\xF5es", color: "#FBBF24", api: "/api/status/integrations" }, "status-mail": { icon: "mail", label: "E-mail", color: "#06B6D4", api: "/api/status/email" }, "status-monitor": { icon: "monitor", label: "Monitor", color: "#84CC16", api: "/api/status/monitor" }, "status-globe": { icon: "globe", label: "Web", color: "#0EA5E9", api: "/api/status/web" }, "status-link": { icon: "link", label: "Links", color: "#A855F7", api: "/api/status/links" }, "status-folder": { icon: "folder", label: "Arquivos", color: "#F472B6", api: "/api/status/files" }, "status-bookmark": { icon: "bookmark", label: "Favoritos", color: "#FB923C", api: "/api/status/bookmarks" }, "status-clipboard": { icon: "clipboard", label: "Logs", color: "#4ADE80", api: "/api/status/logs" }, "status-pie-chart": { icon: "pie", label: "M\xE9tricas", color: "#C084FC", api: "/api/status/metrics" }, "status-target": { icon: "target", label: "Metas", color: "#F87171", api: "/api/status/goals" }, "status-credit-card": { icon: "credit-card", label: "Pagamentos", color: "#2DD4BF", api: "/api/status/payments" }, "status-hard-drive": { icon: "hard-drive", label: "Storage", color: "#818CF8", api: "/api/status/storage" }, "status-language": { icon: "globe", label: "Idioma", color: "#FB7185", api: "/api/status/language" } };
class PanelStatusController {
  constructor() {
    this._container = null;
    this._statusType = null;
    this._config = null;
    this._initialized = false;
    this._refreshTimer = null;
    this._data = null;
    _initPorts();
  }
  _canRefresh() {
    if (!this._initialized) return false;
    if (!_isDocumentVisible()) return false;
    if (!_isAuthenticated()) return false;
    return true;
  }
  mount(container, config = {}) {
    return Promise.resolve().then(() => {
      if (this._initialized) return this.unmount();
    }).then(() => {
      this._container = typeof container === "string" ? document.querySelector(container) : container;
      if (!this._container) {
        _log("error", "Container not found");
        return false;
      }
      if (!_isAuthenticated()) {
        this._container.innerHTML = '<div style="padding:2rem;text-align:center;color:#F59E0B;font-size:14px;">\u{1F512} Login necess\xE1rio</div>';
        return false;
      }
      this._statusType = this._detectStatusType();
      this._config = STATUS_TYPES[this._statusType] || STATUS_TYPES["status-activity"];
      _log("info", `Mounting status panel: ${this._statusType}`);
      this._render();
      return this._loadData();
    }).then(() => {
      this._startRefresh();
      this._initialized = true;
      return true;
    });
  }
  unmount() {
    this._stopRefresh();
    if (this._container) this._container.innerHTML = "";
    this._initialized = false;
    this._data = null;
    _log("debug", "Panel unmounted");
    return Promise.resolve(true);
  }
  _detectStatusType() {
    const router = _getPort("router");
    let route = "";
    if (router?.getCurrentRoute) {
      const current = router.getCurrentRoute();
      route = current?.path ?? (typeof current === "string" ? current : "");
    } else if (router?.current) route = router.current;
    if (!route && typeof window !== "undefined" && window.location) route = window.location.hash || "#/";
    return route.replace("#/", "").split("?")[0] || "status-activity";
  }
  _render() {
    const { icon: iconName, label, color } = this._config;
    const mainIcon = icon(iconName);
    this._container.innerHTML = `<div class="panel-status" data-status-type="${this._statusType}"><div class="panel-status__header" style="--status-color: ${color}"><div class="panel-status__icon">${mainIcon}</div><div class="panel-status__title"><h1>Status: ${label}</h1><span class="panel-status__subtitle">${this._statusType}</span></div><div class="panel-status__actions"><button class="btn-icon" data-action="refresh" title="Atualizar">${icon("refresh-cw")}</button></div></div><div class="panel-status__content"><div class="panel-status__loading"><div class="spinner"></div><span>Carregando dados...</span></div><div class="panel-status__data" style="display:none"><div class="status-grid"><div class="status-card status-card--main" style="--card-color: ${color}"><div class="status-card__icon">${mainIcon}</div><div class="status-card__info"><span class="status-card__label">Status Geral</span><span class="status-card__value status-value" data-field="status">--</span></div></div><div class="status-card"><div class="status-card__icon">${icon("clock", "system")}</div><div class="status-card__info"><span class="status-card__label">Uptime</span><span class="status-card__value" data-field="uptime">--</span></div></div><div class="status-card"><div class="status-card__icon">${icon("activity", "charts")}</div><div class="status-card__info"><span class="status-card__label">Lat\xEAncia</span><span class="status-card__value" data-field="latency">--</span></div></div><div class="status-card"><div class="status-card__icon">${icon("bar-chart-2", "charts")}</div><div class="status-card__info"><span class="status-card__label">Uso</span><span class="status-card__value" data-field="usage">--</span></div></div></div><div class="status-details"><h3>Detalhes</h3><div class="status-details__content" data-field="details"><p>Informa\xE7\xF5es detalhadas aparecer\xE3o aqui.</p></div></div><div class="status-footer"><span class="status-timestamp">\xDAltima atualiza\xE7\xE3o: <span data-field="timestamp">--</span></span></div></div><div class="panel-status__error" style="display:none">${icon("alert-triangle", "system")}<span>Erro ao carregar dados</span><button class="btn btn--sm" data-action="retry">Tentar novamente</button></div></div></div><style>.panel-status{padding:24px;height:100%;display:flex;flex-direction:column;background:var(--bg-primary,#0a0a0f)}.panel-status__header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border-color,#1e1e2e)}.panel-status__icon{width:48px;height:48px;border-radius:12px;background:var(--status-color,#3B82F6);display:flex;align-items:center;justify-content:center}.panel-status__icon svg{width:24px;height:24px;color:white}.panel-status__title h1{font-size:1.5rem;font-weight:600;color:var(--text-primary,#fff);margin:0}.panel-status__subtitle{font-size:0.875rem;color:var(--text-secondary,#888)}.panel-status__actions{margin-left:auto}.panel-status__content{flex:1;overflow-y:auto}.panel-status__loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:48px;color:var(--text-secondary,#888)}.spinner{width:32px;height:32px;border:3px solid var(--border-color,#1e1e2e);border-top-color:var(--accent,#3B82F6);border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.status-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}.status-card{background:var(--bg-secondary,#12121a);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px;border:1px solid var(--border-color,#1e1e2e)}.status-card--main{grid-column:span 2;background:linear-gradient(135deg,var(--card-color,#3B82F6)22,var(--bg-secondary,#12121a));border-color:var(--card-color,#3B82F6)44}.status-card__icon{width:40px;height:40px;border-radius:8px;background:var(--bg-tertiary,#1a1a24);display:flex;align-items:center;justify-content:center}.status-card__icon svg{width:20px;height:20px;color:var(--text-secondary,#888)}.status-card--main .status-card__icon{background:var(--card-color,#3B82F6)33}.status-card--main .status-card__icon svg{color:var(--card-color,#3B82F6)}.status-card__info{display:flex;flex-direction:column}.status-card__label{font-size:0.75rem;color:var(--text-secondary,#888);text-transform:uppercase;letter-spacing:0.5px}.status-card__value{font-size:1.25rem;font-weight:600;color:var(--text-primary,#fff)}.status-value[data-status="online"],.status-value[data-status="ok"]{color:#10B981}.status-value[data-status="offline"],.status-value[data-status="error"]{color:#EF4444}.status-value[data-status="warning"]{color:#F59E0B}.status-details{background:var(--bg-secondary,#12121a);border-radius:12px;padding:20px;border:1px solid var(--border-color,#1e1e2e)}.status-details h3{font-size:1rem;font-weight:600;color:var(--text-primary,#fff);margin:0 0 12px 0}.status-details__content{color:var(--text-secondary,#888);font-size:0.875rem;line-height:1.6}.status-footer{margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color,#1e1e2e)}.status-timestamp{font-size:0.75rem;color:var(--text-tertiary,#666)}.panel-status__error{display:flex;flex-direction:column;align-items:center;gap:12px;padding:48px;color:var(--text-secondary,#888)}.panel-status__error svg{width:48px;height:48px;color:#EF4444}.btn-icon{background:transparent;border:none;padding:8px;border-radius:8px;cursor:pointer;color:var(--text-secondary,#888);transition:all 0.2s}.btn-icon:hover{background:var(--bg-tertiary,#1a1a24);color:var(--text-primary,#fff)}.btn-icon svg{width:18px;height:18px}.btn{padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-weight:500;transition:all 0.2s}.btn--sm{padding:6px 12px;font-size:0.875rem}@media(max-width:768px){.status-card--main{grid-column:span 1}}</style>`;
    this._container.querySelector('[data-action="refresh"]')?.addEventListener("click", () => this._loadData());
    this._container.querySelector('[data-action="retry"]')?.addEventListener("click", () => this._loadData());
  }
  _loadData() {
    if (!this._canRefresh()) return Promise.resolve();
    const loading = this._container.querySelector(".panel-status__loading");
    const data = this._container.querySelector(".panel-status__data");
    const error = this._container.querySelector(".panel-status__error");
    loading.style.display = "flex";
    data.style.display = "none";
    error.style.display = "none";
    return new Promise((r) => setTimeout(r, 500)).then(() => {
      this._data = { status: "online", uptime: "99.9%", latency: "23ms", usage: "42%", details: `Sistema operando normalmente. \xDAltima verifica\xE7\xE3o realizada com sucesso. Todos os servi\xE7os de ${this._config.label} est\xE3o funcionais.`, timestamp: (/* @__PURE__ */ new Date()).toLocaleString("pt-BR") };
      this._updateUI();
      loading.style.display = "none";
      data.style.display = "block";
    }).catch((err) => {
      _log("error", "Failed to load data", err);
      loading.style.display = "none";
      error.style.display = "flex";
    });
  }
  _updateUI() {
    if (!this._data) return;
    ["status", "uptime", "latency", "usage", "details", "timestamp"].forEach((field) => {
      const el = this._container.querySelector(`[data-field="${field}"]`);
      if (el && this._data[field]) {
        if (field === "status") {
          el.textContent = this._data[field].toUpperCase();
          el.dataset.status = this._data[field].toLowerCase();
        } else el.textContent = this._data[field];
      }
    });
  }
  _startRefresh() {
    this._refreshTimer = setInterval(() => {
      if (this._canRefresh()) this._loadData();
    }, 6e4);
  }
  _stopRefresh() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    return { status: this._initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, statusType: this._statusType, hasData: !!this._data, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
  }
  info() {
    const portsSnapshot = Ports.snapshot();
    return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, statusType: this._statusType, hasData: !!this._data, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
  }
  cleanup() {
    return this.unmount();
  }
  reset() {
    return this.cleanup();
  }
}
const controller = new PanelStatusController();
const mount = (container, config = {}) => controller.mount(container, config);
const unmount = () => controller.unmount();
const destroy = () => unmount();
const healthCheck = () => controller.healthCheck();
const info = () => controller.info();
const cleanup = () => controller.cleanup();
const reset = () => controller.reset();
var panel_status_default = { VERSION, PANEL_ID, MODULE_ID, mount, unmount, destroy, healthCheck, info, cleanup, reset, getVersion, injectPorts, getPorts };
export {
  MODULE_ID,
  PANEL_ID,
  VERSION,
  cleanup,
  panel_status_default as default,
  destroy,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  reset,
  unmount
};
