// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.1-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-17.ui.drawer
// PURPOSE: Panel-17 Drawer Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   formatDuration, formatDateTime, getHealthClass, getHealthText, getRateClass f...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   DrawerComponent() — exported function
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

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

// @ts-expect-error TS migration - TS2305, TS2724
import { formatDuration, formatDateTime, getHealthClass, getHealthText, getRateClass } from '../utils/formatters.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-17.ui.drawer';

const hasDocument = typeof document !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _setScrollLock(locked: boolean) { const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? 'scroll-lock' : 'scroll-unlock', source: MODULE_ID, timestamp: Date.now() }); return true; } if (hasDocument && document.body) { document.body.style.overflow = locked ? 'hidden' : ''; } return false; }
function _getStatusClass(health: string) { const healthClass = getHealthClass(health); const map: Record<string, string> = { 'status-active': 'active', 'status-warning': 'warning', 'status-error': 'error', 'status-inactive': 'inactive' }; return map[healthClass] || 'inactive'; }
function _getRateClassDrawer(rate: number) { const rateClass = getRateClass(rate); const map: Record<string, string> = { 'high': 'ok', 'medium': 'warning', 'low': 'error' }; return map[rateClass] || 'error'; }

export function DrawerComponent(this: any, logger: Record<string, unknown>, options: Record<string, unknown>) { options = options || {}; this.logger = logger; this.onAction = options.onAction || (() => {}); this.overlay = null; this.drawer = null; this.currentJob = null; this.isOpen = false; this._escHandler = null; this._overlayClickHandler = null; this._abortController = null; _initPorts(); }

DrawerComponent.prototype.init = function() {
  if (this.overlay) return;
  const self = this;
  this.overlay = document.createElement('div');
  this.overlay.className = 'p17-drawer-overlay';
  this.overlay.innerHTML = '<div class="p17-drawer"><header class="p17-drawer-header"><div class="p17-drawer-title-group"><h3 class="p17-drawer-title" data-drawer-title>Job Details</h3><div class="p17-drawer-subtitle" data-drawer-subtitle></div></div><button class="p17-drawer-close" data-action="close-drawer" aria-label="Fechar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></header><div class="p17-drawer-body" data-drawer-body></div><footer class="p17-drawer-footer" data-drawer-footer><div class="p17-drawer-actions"><button class="p17-drawer-action p17-drawer-action--secondary" data-action="view-logs">Logs</button><button class="p17-drawer-action p17-drawer-action--warning" data-action="pause-job">Pausar</button><button class="p17-drawer-action p17-drawer-action--primary" data-action="run-job">Executar</button></div></footer></div>';
  document.body.appendChild(this.overlay);
  this.drawer = this.overlay.querySelector('.p17-drawer');
  this._escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape' && self.isOpen) self.close(); };
  this._overlayClickHandler = (e: MouseEvent) => { if (e.target === self.overlay) self.close(); const t = e.target as HTMLElement; if (t.matches('[data-action="close-drawer"]') || t.closest('[data-action="close-drawer"]')) self.close(); const actionBtn = t.closest('[data-action]') as HTMLElement | null; if (actionBtn && self.currentJob) { const action = actionBtn.dataset.action; if (action !== 'close-drawer') self.onAction(action, self.currentJob); } };
  this._abortController = new AbortController();
  document.addEventListener('keydown', this._escHandler, { signal: this._abortController.signal });
  this.overlay.addEventListener('click', this._overlayClickHandler, { signal: this._abortController.signal });
};

DrawerComponent.prototype.open = function(job: Record<string, unknown>) { if (!this.overlay) this.init(); this.currentJob = job; this.isOpen = true; this.overlay.classList.add('open'); this.drawer.classList.add('open'); _setScrollLock(true); this.renderJobDetails(job); this.updateActionButtons(job); };
DrawerComponent.prototype.close = function() { if (!this.isOpen) return; this.isOpen = false; this.overlay.classList.remove('open'); this.drawer.classList.remove('open'); _setScrollLock(false); };
DrawerComponent.prototype.updateActionButtons = function(job: Record<string, unknown>) { const footer = this.overlay.querySelector('[data-drawer-footer]'); if (!footer) return; const pauseBtn = footer.querySelector('[data-action="pause-job"]'); const runBtn = footer.querySelector('[data-action="run-job"]'); if (pauseBtn) { const isActive = job.is_active == 1; pauseBtn.textContent = isActive ? 'Pausar' : 'Ativar'; pauseBtn.dataset.action = isActive ? 'pause-job' : 'activate-job'; } if (runBtn) { const isRunning = job.is_running == 1; runBtn.disabled = isRunning; } };
DrawerComponent.prototype.renderJobDetails = function(job: Record<string, unknown>) { const title = this.overlay.querySelector('[data-drawer-title]'); const subtitle = this.overlay.querySelector('[data-drawer-subtitle]'); const body = this.overlay.querySelector('[data-drawer-body]'); if (title) title.textContent = String(job.job_name || job.name || 'Job'); if (subtitle) { const type = String(job.job_type || job.type || 'api').toUpperCase(); const health = String(job.health_status || 'inactive'); subtitle.innerHTML = `<span class="p17-job-type type-${type.toLowerCase()}">${type}</span><span class="p17-status-indicator status-${_getStatusClass(health)}"><span class="p17-status-dot"></span>${getHealthText(health)}</span>`; } if (body) body.innerHTML = this._buildDetailsHTML(job); };

DrawerComponent.prototype._buildDetailsHTML = function(job: Record<string, unknown>) { const successRate = parseFloat(String(job.success_rate || 0)); const errors = parseInt(String(job.error_count || 0)); const totalExec = parseInt(String(job.total_executions || 0)); const avgTime = parseFloat(String(job.avg_execution_time || 0)); const sla = (job.sla as Record<string, unknown>) || {}; return `<div class="p17-drawer-section"><h4>Métricas</h4><div class="p17-drawer-kpis"><div class="p17-drawer-kpi"><div class="p17-drawer-kpi-label">Execuções</div><div class="p17-drawer-kpi-value">${totalExec.toLocaleString('pt-BR')}</div></div><div class="p17-drawer-kpi"><div class="p17-drawer-kpi-label">Taxa de Sucesso</div><div class="p17-drawer-kpi-value ${_getRateClassDrawer(successRate)}">${successRate.toFixed(1)}%</div></div><div class="p17-drawer-kpi"><div class="p17-drawer-kpi-label">Tempo Médio</div><div class="p17-drawer-kpi-value">${formatDuration(avgTime)}</div></div><div class="p17-drawer-kpi"><div class="p17-drawer-kpi-label">Erros</div><div class="p17-drawer-kpi-value ${errors > 0 ? 'error' : ''}">${errors}</div></div></div></div><div class="p17-drawer-section"><h4>SLA</h4><div class="p17-drawer-sla">${this._buildSLARow('Taxa de Sucesso', sla.success_rate as Record<string, unknown>)}${this._buildSLARow('Tempo de Execução', sla.duration as Record<string, unknown>)}${this._buildSLARow('Erros', sla.errors as Record<string, unknown>)}</div></div><div class="p17-drawer-section"><h4>Informações</h4><div class="p17-drawer-info"><div class="p17-drawer-info-row"><span>ID</span><span>${job.id || '--'}</span></div><div class="p17-drawer-info-row"><span>Última Execução</span><span>${formatDateTime(String(job.last_execution || ''))}</span></div><div class="p17-drawer-info-row"><span>Último Sucesso</span><span>${formatDateTime(String(job.last_success || ''))}</span></div></div></div>`; };

DrawerComponent.prototype._buildSLARow = (label: string, slaData: Record<string, unknown> | null | undefined) => { if (!slaData) return `<div class="p17-drawer-sla-item"><span>${label}</span><span>--</span></div>`; const status = slaData.status || 'ok'; const value = slaData.value != null ? slaData.value : '--'; return `<div class="p17-drawer-sla-item"><span>${label}</span><span><span class="p17-drawer-sla-dot ${status}"></span>${value}</span></div>`; };
DrawerComponent.prototype.destroy = function() { if (this._abortController) { this._abortController.abort(); this._abortController = null; } if (this.overlay) { this.overlay.remove(); } this.overlay = null; this.drawer = null; this.currentJob = null; this.isOpen = false; };

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { drawerReady: true, portsInitialized: Ports.isInitialized() } }; }

export default DrawerComponent;
