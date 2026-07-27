import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { formatDuration, formatDateTime, getHealthClass, getHealthText, getRateClass } from "../utils/formatters.js";
const MODULE_ID = "panel-19.ui.drawer";
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
function _setScrollLock(locked) {
  _initPorts();
  const layoutManager = _getPort("layoutManager");
  if (layoutManager && layoutManager.setScrollLocked) {
    layoutManager.setScrollLocked(locked);
    return true;
  }
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? "scroll-lock" : "scroll-unlock", source: MODULE_ID, timestamp: Date.now() });
    return true;
  }
  if (typeof document !== "undefined" && document.body) {
    document.body.style.overflow = locked ? "hidden" : "";
  }
  return false;
}
function _getStatusClass(health) {
  const healthClass = getHealthClass(health);
  const map = { "status-active": "active", "status-warning": "warning", "status-error": "error", "status-inactive": "inactive" };
  return map[healthClass] || "inactive";
}
function _getRateClassDrawer(rate) {
  const rateClass = getRateClass(rate);
  const map = { "high": "ok", "medium": "warning", "low": "error" };
  return map[rateClass] || "error";
}
function DrawerComponent(logger, options) {
  if (options === void 0) options = {};
  this.logger = logger;
  this.onAction = options.onAction || (() => {
  });
  this.overlay = null;
  this.drawer = null;
  this.currentJob = null;
  this.isOpen = false;
  this._escHandler = null;
  this._overlayClickHandler = null;
  this._abortController = null;
}
DrawerComponent.prototype.init = function() {
  const self = this;
  if (this.overlay) return;
  this.overlay = document.createElement("div");
  this.overlay.className = "p19-drawer-overlay";
  this.overlay.innerHTML = '<div class="p19-drawer"><header class="p19-drawer-header"><div class="p19-drawer-title-group"><h3 class="p19-drawer-title" data-drawer-title>Job Details</h3><div class="p19-drawer-subtitle" data-drawer-subtitle></div></div><button class="p19-drawer-close" data-action="close-drawer" aria-label="Fechar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></header><div class="p19-drawer-body" data-drawer-body><div class="p19-drawer-loading"><div class="p19-drawer-spinner"></div><span>Carregando...</span></div></div><footer class="p19-drawer-footer" data-drawer-footer><div class="p19-drawer-actions"><button class="p19-drawer-action p19-drawer-action--secondary" data-action="view-logs" title="Ver Logs"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> Logs</button><button class="p19-drawer-action p19-drawer-action--warning" data-action="pause-job" title="Pausar Job"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar</button><button class="p19-drawer-action p19-drawer-action--primary" data-action="run-job" title="Executar Agora"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Executar</button></div></footer></div>';
  document.body.appendChild(this.overlay);
  this.drawer = this.overlay.querySelector(".p19-drawer");
  this._escHandler = (e) => {
    if (e.key === "Escape" && self.isOpen) self.close();
  };
  this._overlayClickHandler = (e) => {
    const target = e.target;
    if (e.target === self.overlay) self.close();
    if (target.matches('[data-action="close-drawer"]') || target.closest('[data-action="close-drawer"]')) self.close();
    const actionBtn = target.closest("[data-action]");
    if (actionBtn && self.currentJob) {
      const action = actionBtn.dataset.action;
      if (action !== "close-drawer") {
        self.onAction(action, self.currentJob);
      }
    }
  };
  this._abortController = new AbortController();
  document.addEventListener("keydown", this._escHandler, { signal: this._abortController.signal });
  this.overlay.addEventListener("click", this._overlayClickHandler, { signal: this._abortController.signal });
  if (this.logger && this.logger.debug) this.logger.debug("drawer.init");
};
DrawerComponent.prototype.open = function(job) {
  if (!this.overlay) this.init();
  this.currentJob = job;
  this.isOpen = true;
  this.overlay.classList.add("open");
  this.drawer.classList.add("open");
  _setScrollLock(true);
  this.renderJobDetails(job);
  this.updateActionButtons(job);
  if (this.logger && this.logger.debug) this.logger.debug("drawer.open", { jobId: job ? job.id : null });
};
DrawerComponent.prototype.close = function() {
  if (!this.isOpen) return;
  this.isOpen = false;
  this.overlay.classList.remove("open");
  this.drawer.classList.remove("open");
  _setScrollLock(false);
  if (this.logger && this.logger.debug) this.logger.debug("drawer.close");
};
DrawerComponent.prototype.updateActionButtons = function(job) {
  const footer = this.overlay.querySelector("[data-drawer-footer]");
  if (!footer) return;
  const pauseBtn = footer.querySelector('[data-action="pause-job"]');
  const runBtn = footer.querySelector('[data-action="run-job"]');
  if (pauseBtn) {
    const isActive = job.is_active == 1;
    pauseBtn.innerHTML = isActive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Ativar';
    pauseBtn.dataset.action = isActive ? "pause-job" : "activate-job";
  }
  if (runBtn) {
    const isRunning = job.is_running == 1;
    runBtn.disabled = isRunning;
    runBtn.title = isRunning ? "Job em execu\xE7\xE3o" : "Executar Agora";
  }
};
DrawerComponent.prototype.renderJobDetails = function(job) {
  const title = this.overlay.querySelector("[data-drawer-title]");
  const subtitle = this.overlay.querySelector("[data-drawer-subtitle]");
  const body = this.overlay.querySelector("[data-drawer-body]");
  if (title) title.textContent = job.job_name || job.name || "Job";
  if (subtitle) {
    const type = String(job.job_type || job.type || "api").toUpperCase();
    const health = String(job.health_status || "inactive");
    subtitle.innerHTML = `<span class="p19-job-type type-${type.toLowerCase()}">${type}</span><span class="p19-status-indicator status-${_getStatusClass(health)}"><span class="p19-status-dot"></span>${getHealthText(health)}</span>`;
  }
  if (body) body.innerHTML = this._buildDetailsHTML(job);
};
DrawerComponent.prototype._buildDetailsHTML = function(job) {
  const successRate = parseFloat(String(job.success_rate || 0));
  const errors = parseInt(String(job.error_count || 0));
  const totalExec = parseInt(String(job.total_executions || 0));
  const avgTime = parseFloat(String(job.avg_execution_time || 0));
  const sla = job.sla || {};
  const slaObj = sla;
  return `<div class="p19-drawer-section"><h4 class="p19-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg> M\xE9tricas</h4><div class="p19-drawer-kpis"><div class="p19-drawer-kpi"><div class="p19-drawer-kpi-label">Execu\xE7\xF5es</div><div class="p19-drawer-kpi-value">${totalExec.toLocaleString("pt-BR")}</div></div><div class="p19-drawer-kpi"><div class="p19-drawer-kpi-label">Taxa de Sucesso</div><div class="p19-drawer-kpi-value ${_getRateClassDrawer(successRate)}">${successRate.toFixed(1)}%</div></div><div class="p19-drawer-kpi"><div class="p19-drawer-kpi-label">Tempo M\xE9dio</div><div class="p19-drawer-kpi-value">${formatDuration(avgTime)}</div></div><div class="p19-drawer-kpi"><div class="p19-drawer-kpi-label">Erros</div><div class="p19-drawer-kpi-value ${errors > 0 ? "error" : ""}">${errors}</div></div></div></div><div class="p19-drawer-section"><h4 class="p19-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> SLA</h4><div class="p19-drawer-sla">${this._buildSLARow("Taxa de Sucesso", slaObj.success_rate)}${this._buildSLARow("Tempo de Execu\xE7\xE3o", slaObj.duration)}${this._buildSLARow("Erros", slaObj.errors)}</div></div><div class="p19-drawer-section"><h4 class="p19-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Informa\xE7\xF5es</h4><div class="p19-drawer-info"><div class="p19-drawer-info-row"><span class="p19-drawer-info-label">ID</span><span class="p19-drawer-info-value">${job.id || "--"}</span></div><div class="p19-drawer-info-row"><span class="p19-drawer-info-label">\xDAltima Execu\xE7\xE3o</span><span class="p19-drawer-info-value">${formatDateTime(String(job.last_execution || ""))}</span></div><div class="p19-drawer-info-row"><span class="p19-drawer-info-label">\xDAltimo Sucesso</span><span class="p19-drawer-info-value">${formatDateTime(String(job.last_success || ""))}</span></div><div class="p19-drawer-info-row"><span class="p19-drawer-info-label">Criado em</span><span class="p19-drawer-info-value">${formatDateTime(String(job.created_at || ""))}</span></div><div class="p19-drawer-info-row"><span class="p19-drawer-info-label">Atualizado em</span><span class="p19-drawer-info-value">${formatDateTime(String(job.updated_at || ""))}</span></div></div></div>`;
};
DrawerComponent.prototype._buildSLARow = (label, slaData) => {
  if (!slaData) return `<div class="p19-drawer-sla-item"><span class="p19-drawer-sla-label">${label}</span><span class="p19-drawer-sla-value">--</span></div>`;
  const status = slaData.status || "ok";
  const value = slaData.value !== void 0 ? slaData.value : "--";
  let displayValue = value;
  if (label.indexOf("Tempo") !== -1 && typeof value === "number") {
    displayValue = formatDuration(value / 1e3);
  } else if (label.indexOf("Taxa") !== -1 && typeof value === "number") {
    displayValue = `${value.toFixed(1)}%`;
  }
  return `<div class="p19-drawer-sla-item"><span class="p19-drawer-sla-label">${label}</span><span class="p19-drawer-sla-value"><span class="p19-drawer-sla-dot ${status}"></span>${displayValue}</span></div>`;
};
DrawerComponent.prototype.destroy = function() {
  if (this._abortController) {
    this._abortController.abort();
    this._abortController = null;
  }
  if (this.overlay) {
    this.overlay.remove();
  }
  this.overlay = null;
  this.drawer = null;
  this.currentJob = null;
  this.isOpen = false;
  if (this.logger && this.logger.debug) this.logger.debug("drawer.destroyed");
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { drawerReady: true } };
}
var drawer_default = DrawerComponent;
export {
  DrawerComponent,
  MODULE_ID,
  VERSION,
  drawer_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
