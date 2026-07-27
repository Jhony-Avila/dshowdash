// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15.ui.drawer
// PURPOSE: Panel-15 Drawer Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_EVENTS, UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//   formatDuration, formatDateTime, getHealthClass, getHealthText, getRateClass f...
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   DrawerComponent() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   UI_INTENTS.REQUEST_LAYOUT
// LISTENS (eventos):
//   'click'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_EVENTS, UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { formatDuration, formatDateTime, getHealthClass, getHealthText, getRateClass } from '../utils/formatters.js';

const MODULE_ID = 'panel-15.ui.drawer';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _setScrollLock(locked: boolean) {
  _initPorts();
  const layoutManager = _getPort('layoutManager');
  if (layoutManager && layoutManager.setScrollLocked) { layoutManager.setScrollLocked(locked); return true; }
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) { eventBus.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? 'scroll-lock' : 'scroll-unlock', source: MODULE_ID, timestamp: Date.now() }); return true; }
  if (typeof document !== 'undefined' && document.body) { document.body.style.overflow = locked ? 'hidden' : ''; }
  return false;
}

function _getStatusClass(health: string) {
  const healthClass = getHealthClass(health);
  const map: Record<string, string> = { 'status-active': 'active', 'status-warning': 'warning', 'status-error': 'error', 'status-inactive': 'inactive' };
  return map[healthClass] || 'inactive';
}

function _getRateClassDrawer(rate: number) {
  const rateClass = getRateClass(rate);
  const map: Record<string, string> = { 'high': 'ok', 'medium': 'warning', 'low': 'error' };
  return map[rateClass] || 'error';
}

function DrawerComponent(this: any, logger: Record<string, unknown>, options: Record<string, unknown>) {
  if (options === undefined) options = {};
  this.logger = logger;
  this.onAction = options.onAction || (() => {});
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
  this.overlay = document.createElement('div');
  this.overlay.className = 'p15-drawer-overlay';
  this.overlay.innerHTML = '<div class="p15-drawer"><header class="p15-drawer-header"><div class="p15-drawer-title-group"><h3 class="p15-drawer-title" data-drawer-title>Job Details</h3><div class="p15-drawer-subtitle" data-drawer-subtitle></div></div><button class="p15-drawer-close" data-action="close-drawer" aria-label="Fechar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></header><div class="p15-drawer-body" data-drawer-body><div class="p15-drawer-loading"><div class="p15-drawer-spinner"></div><span>Carregando...</span></div></div><footer class="p15-drawer-footer" data-drawer-footer><div class="p15-drawer-actions"><button class="p15-drawer-action p15-drawer-action--secondary" data-action="view-logs" title="Ver Logs"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> Logs</button><button class="p15-drawer-action p15-drawer-action--warning" data-action="pause-job" title="Pausar Job"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar</button><button class="p15-drawer-action p15-drawer-action--primary" data-action="run-job" title="Executar Agora"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Executar</button></div></footer></div>';
  document.body.appendChild(this.overlay);
  this.drawer = this.overlay.querySelector('.p15-drawer');
  this._escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape' && self.isOpen) self.close(); };
  this._overlayClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === self.overlay) self.close();
    if (target.matches('[data-action="close-drawer"]') || target.closest('[data-action="close-drawer"]')) self.close();
    const actionBtn = target.closest('[data-action]') as HTMLElement | null;
    if (actionBtn && self.currentJob) { const action = actionBtn.dataset.action; if (action !== 'close-drawer') { self.onAction(action, self.currentJob); } }
  };
  this._abortController = new AbortController();
  document.addEventListener('keydown', this._escHandler, { signal: this._abortController.signal });
  this.overlay.addEventListener('click', this._overlayClickHandler, { signal: this._abortController.signal });
  if (this.logger && this.logger.debug) this.logger.debug('drawer.init');
};

DrawerComponent.prototype.open = function(job: Record<string, unknown>) {
  if (!this.overlay) this.init();
  this.currentJob = job;
  this.isOpen = true;
  this.overlay.classList.add('open');
  this.drawer.classList.add('open');
  _setScrollLock(true);
  this.renderJobDetails(job);
  this.updateActionButtons(job);
  if (this.logger && this.logger.debug) this.logger.debug('drawer.open', { jobId: job ? job.id : null });
};

DrawerComponent.prototype.close = function() {
  if (!this.isOpen) return;
  this.isOpen = false;
  this.overlay.classList.remove('open');
  this.drawer.classList.remove('open');
  _setScrollLock(false);
  if (this.logger && this.logger.debug) this.logger.debug('drawer.close');
};

DrawerComponent.prototype.updateActionButtons = function(job: Record<string, unknown>) {
  const footer = this.overlay.querySelector('[data-drawer-footer]');
  if (!footer) return;
  const pauseBtn = footer.querySelector('[data-action="pause-job"]');
  const runBtn = footer.querySelector('[data-action="run-job"]');
  if (pauseBtn) {
    const isActive = job.is_active == 1;
    pauseBtn.innerHTML = isActive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Ativar';
    pauseBtn.dataset.action = isActive ? 'pause-job' : 'activate-job';
  }
  if (runBtn) { const isRunning = job.is_running == 1; runBtn.disabled = isRunning; runBtn.title = isRunning ? 'Job em execução' : 'Executar Agora'; }
};

DrawerComponent.prototype.renderJobDetails = function(job: Record<string, unknown>) {
  const title = this.overlay.querySelector('[data-drawer-title]');
  const subtitle = this.overlay.querySelector('[data-drawer-subtitle]');
  const body = this.overlay.querySelector('[data-drawer-body]');
  if (title) title.textContent = String(job.job_name || job.name || 'Job');
  if (subtitle) { const type = String(job.job_type || job.type || 'api').toUpperCase(); const health = String(job.health_status || 'inactive'); subtitle.innerHTML = `<span class="p15-job-type type-${type.toLowerCase()}">${type}</span><span class="p15-status-indicator status-${_getStatusClass(health)}"><span class="p15-status-dot"></span>${getHealthText(health)}</span>`; }
  if (body) body.innerHTML = this._buildDetailsHTML(job);
};

DrawerComponent.prototype._buildDetailsHTML = function(job: Record<string, unknown>) {
  const successRate = parseFloat(String(job.success_rate || 0));
  const errors = parseInt(String(job.error_count || 0));
  const totalExec = parseInt(String(job.total_executions || 0));
  const avgTime = parseFloat(String(job.avg_execution_time || 0));
  const sla = (job.sla || {}) as Record<string, unknown>;

  return `<div class="p15-drawer-section"><h4 class="p15-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg> Métricas</h4><div class="p15-drawer-kpis"><div class="p15-drawer-kpi"><div class="p15-drawer-kpi-label">Execuções</div><div class="p15-drawer-kpi-value">${totalExec.toLocaleString('pt-BR')}</div></div><div class="p15-drawer-kpi"><div class="p15-drawer-kpi-label">Taxa de Sucesso</div><div class="p15-drawer-kpi-value ${_getRateClassDrawer(successRate)}">${successRate.toFixed(1)}%</div></div><div class="p15-drawer-kpi"><div class="p15-drawer-kpi-label">Tempo Médio</div><div class="p15-drawer-kpi-value">${formatDuration(avgTime)}</div></div><div class="p15-drawer-kpi"><div class="p15-drawer-kpi-label">Erros</div><div class="p15-drawer-kpi-value ${errors > 0 ? 'error' : ''}">${errors}</div></div></div></div><div class="p15-drawer-section"><h4 class="p15-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> SLA</h4><div class="p15-drawer-sla">${this._buildSLARow('Taxa de Sucesso', sla.success_rate)}${this._buildSLARow('Tempo de Execução', sla.duration)}${this._buildSLARow('Erros', sla.errors)}</div></div><div class="p15-drawer-section"><h4 class="p15-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Informações</h4><div class="p15-drawer-info"><div class="p15-drawer-info-row"><span class="p15-drawer-info-label">ID</span><span class="p15-drawer-info-value">${job.id || '--'}</span></div><div class="p15-drawer-info-row"><span class="p15-drawer-info-label">Última Execução</span><span class="p15-drawer-info-value">${formatDateTime(job.last_execution)}</span></div><div class="p15-drawer-info-row"><span class="p15-drawer-info-label">Último Sucesso</span><span class="p15-drawer-info-value">${formatDateTime(job.last_success)}</span></div><div class="p15-drawer-info-row"><span class="p15-drawer-info-label">Criado em</span><span class="p15-drawer-info-value">${formatDateTime(job.created_at)}</span></div><div class="p15-drawer-info-row"><span class="p15-drawer-info-label">Atualizado em</span><span class="p15-drawer-info-value">${formatDateTime(job.updated_at)}</span></div></div></div>`;
};

DrawerComponent.prototype._buildSLARow = (label: string, slaData: Record<string, unknown>) => {
  if (!slaData) return `<div class="p15-drawer-sla-item"><span class="p15-drawer-sla-label">${label}</span><span class="p15-drawer-sla-value">--</span></div>`;
  const status = slaData.status || 'ok';
  const value = slaData.value !== undefined ? slaData.value : '--';
  let displayValue = value;
  if (label.indexOf('Tempo') !== -1 && typeof value === 'number') { displayValue = formatDuration(value / 1000); }
  else if (label.indexOf('Taxa') !== -1 && typeof value === 'number') { displayValue = `${value.toFixed(1)}%`; }
  return `<div class="p15-drawer-sla-item"><span class="p15-drawer-sla-label">${label}</span><span class="p15-drawer-sla-value"><span class="p15-drawer-sla-dot ${status}"></span>${displayValue}</span></div>`;
};

DrawerComponent.prototype.destroy = function() {
  if (this._abortController) { this._abortController.abort(); this._abortController = null; }
  if (this.overlay) { this.overlay.remove(); }
  this.overlay = null; this.drawer = null; this.currentJob = null; this.isOpen = false;
  if (this.logger && this.logger.debug) this.logger.debug('drawer.destroyed');
};

function info() { return { moduleId: MODULE_ID, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { drawerReady: true } }; }

export { DrawerComponent, VERSION, MODULE_ID, info, healthCheck };
export default DrawerComponent;
