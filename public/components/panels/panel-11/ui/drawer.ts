// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-11.ui.drawer
// PURPOSE: Panel-11 Drawer Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_EVENTS, UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//   ICONS, SEVERITY from ../core/constants.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   DrawerComponent() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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
import { ICONS, SEVERITY } from '../core/constants.js';

const MODULE_ID = 'panel-11.ui.drawer';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _setScrollLock(locked: boolean) {
  const layoutManager = _getPort('layoutManager');
  if (layoutManager && layoutManager.setScrollLocked) { layoutManager.setScrollLocked(locked); return true; }
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) { eventBus.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? 'scroll-lock' : 'scroll-unlock', source: MODULE_ID, timestamp: Date.now() }); return true; }
  if (typeof document !== 'undefined' && document.body) { document.body.style.overflow = locked ? 'hidden' : ''; }
  return false;
}

function DrawerComponent(this: any, logger: Record<string, unknown>) {
  this.logger = logger || console;
  this.isOpen = false;
  this.data = null;
  this.overlay = null;
  this.drawer = null;
  this._abortController = null;
  const self = this;
  this._boundHandleKeydown = (e: KeyboardEvent) => { self._handleKeydown(e); };
  this._boundHandleOverlayClick = () => { self._handleOverlayClick(); };
}

DrawerComponent.prototype.init = function() { _initPorts(); this._createElements(); this._bindEvents(); if (this.logger && this.logger.debug) this.logger.debug('drawer.init'); };

DrawerComponent.prototype._createElements = function() {
  this.overlay = document.createElement('div'); this.overlay.className = 'p11-drawer-overlay'; this.overlay.setAttribute('data-drawer-overlay', '');
  this.drawer = document.createElement('div'); this.drawer.className = 'p11-drawer'; this.drawer.setAttribute('role', 'dialog'); this.drawer.setAttribute('aria-modal', 'true'); this.drawer.setAttribute('aria-labelledby', 'p11-drawer-title');
  document.body.appendChild(this.overlay); document.body.appendChild(this.drawer);
};

DrawerComponent.prototype._bindEvents = function() { this._abortController = new AbortController(); this.overlay.addEventListener('click', this._boundHandleOverlayClick, { signal: this._abortController.signal }); document.addEventListener('keydown', this._boundHandleKeydown, { signal: this._abortController.signal }); };
DrawerComponent.prototype._handleKeydown = function(e: KeyboardEvent) { if (e.key === 'Escape' && this.isOpen) { this.close(); } };
DrawerComponent.prototype._handleOverlayClick = function() { this.close(); };

DrawerComponent.prototype.open = function(data: Record<string, unknown>) {
  const self = this;
  this.data = data; this.drawer.innerHTML = this._render(); this._bindDrawerEvents();
  requestAnimationFrame(() => { self.overlay.classList.add('open'); self.drawer.classList.add('open'); self.isOpen = true; _setScrollLock(true); });
  if (this.logger && this.logger.debug) this.logger.debug('drawer.open', { type: data ? data.type : null });
};

DrawerComponent.prototype.close = function() { this.overlay.classList.remove('open'); this.drawer.classList.remove('open'); this.isOpen = false; _setScrollLock(false); if (this.logger && this.logger.debug) this.logger.debug('drawer.close'); };

DrawerComponent.prototype._bindDrawerEvents = function() { const self = this; const closeBtn = this.drawer.querySelector('[data-action="close"]'); if (closeBtn) closeBtn.addEventListener('click', () => { self.close(); }); const exportBtn = this.drawer.querySelector('[data-action="export"]'); if (exportBtn) exportBtn.addEventListener('click', () => { self._export(); }); };

DrawerComponent.prototype._render = function() { const type = this.data ? this.data.type : 'errors'; if (type === 'errors') { return this._renderErrorsDrawer(); } return this._renderGenericDrawer(); };

DrawerComponent.prototype._renderErrorsDrawer = function() {
  const errors = this.data && this.data.errors ? this.data.errors : [];
  let total = 0; let rateSum = 0;
  for (let i = 0; i < errors.length; i++) { total += parseInt(errors[i].errors) || parseInt(errors[i].occurrences) || 0; rateSum += parseFloat(errors[i].error_rate) || 0; }
  const avgRate = errors.length > 0 ? (rateSum / errors.length).toFixed(1) : 0;
  let errorsHtml = '';
  if (errors.length === 0) { errorsHtml = '<div style="text-align:center;color:var(--p11-text-muted);padding:2rem;">Nenhum erro registrado</div>'; }
  else { for (let j = 0; j < errors.length; j++) { errorsHtml += this._renderErrorItem(errors[j]); } }

  // @ts-expect-error TS migration - TS2365
  return `<header class="p11-drawer-header"><div class="p11-drawer-title"><div class="p11-drawer-title-icon">${ICONS.alertTriangle}</div><div><div class="p11-drawer-title-text" id="p11-drawer-title">Detalhes de Erros</div><div class="p11-drawer-title-subtitle">${errors.length} jobs com falhas</div></div></div><button class="p11-drawer-close" data-action="close" aria-label="Fechar">${ICONS.x}</button></header><div class="p11-drawer-content"><div class="p11-drawer-kpis"><div class="p11-drawer-kpi"><div class="p11-drawer-kpi-label">Total de Erros</div><div class="p11-drawer-kpi-value error">${this._formatNumber(total)}</div></div><div class="p11-drawer-kpi"><div class="p11-drawer-kpi-label">Taxa Média</div><div class="p11-drawer-kpi-value ${avgRate > 15 ? 'error' : avgRate > 5 ? 'warning' : 'ok'}">${avgRate}%</div></div><div class="p11-drawer-kpi"><div class="p11-drawer-kpi-label">Jobs Afetados</div><div class="p11-drawer-kpi-value">${errors.length}</div></div><div class="p11-drawer-kpi"><div class="p11-drawer-kpi-label">Severidade</div><div class="p11-drawer-kpi-value ${total > 500 ? 'error' : total > 100 ? 'warning' : 'ok'}">${total > 500 ? 'Crítica' : total > 100 ? 'Alta' : 'Baixa'}</div></div></div><div class="p11-drawer-section"><div class="p11-drawer-section-title">${ICONS.x} Lista de Erros por Job</div><div class="p11-drawer-error-list">${errorsHtml}</div></div></div><footer class="p11-drawer-footer"><span class="p11-drawer-footer-info">Últimos 30 dias</span><div class="p11-drawer-footer-actions"><button class="p11-btn" data-action="export">${ICONS.download} Exportar</button><button class="p11-btn p11-btn--primary" data-action="close">Fechar</button></div></footer>`;
};

DrawerComponent.prototype._renderErrorItem = (error: Record<string, unknown>) => {
  const jobName = (error.job_name as string) || 'Desconhecido'; const count = error.errors || error.occurrences || 0; const rate = parseFloat(error.error_rate as string) || 0;
  const severity = rate > 30 ? 'critical' : rate > 15 ? 'high' : rate > 5 ? 'medium' : 'low'; const sev = SEVERITY[severity];
  return `<div class="p11-drawer-error-item" title="${error.error_message || ''}"><div class="p11-drawer-error-header"><span class="p11-drawer-error-name">${jobName}</span><span class="p11-drawer-error-count">${count} erros</span></div><div class="p11-drawer-error-message">${error.error_message || 'Sem mensagem de erro'}</div><div style="margin-top:0.5rem;display:flex;gap:0.5rem;"><span class="p11-badge" style="background:${sev.bg};color:${sev.color};">${sev.label}</span><span class="p11-badge p11-badge--info">Taxa: ${rate.toFixed(1)}%</span></div></div>`;
};

DrawerComponent.prototype._renderGenericDrawer = () => `<header class="p11-drawer-header"><div class="p11-drawer-title"><div class="p11-drawer-title-icon">${ICONS.activity}</div><div><div class="p11-drawer-title-text" id="p11-drawer-title">Detalhes</div><div class="p11-drawer-title-subtitle">Informações adicionais</div></div></div><button class="p11-drawer-close" data-action="close" aria-label="Fechar">${ICONS.x}</button></header><div class="p11-drawer-content"><div style="text-align:center;color:var(--p11-text-muted);padding:2rem;">Nenhum dado disponível</div></div><footer class="p11-drawer-footer"><span class="p11-drawer-footer-info"></span><button class="p11-btn p11-btn--primary" data-action="close">Fechar</button></footer>`;

DrawerComponent.prototype._export = function() {
  if (!this.data || !this.data.errors) return;
  const rows = [['Job', 'Erros', 'Taxa', 'Mensagem']];
  for (let i = 0; i < this.data.errors.length; i++) { const e = this.data.errors[i]; rows.push([e.job_name || 'Desconhecido', e.errors || e.occurrences || 0, `${(parseFloat(e.error_rate) || 0).toFixed(1)}%`, (e.error_message || '').replace(/,/g, ';')]); }
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `erros_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
};

DrawerComponent.prototype._formatNumber = (val: unknown) => { if (val == null) return '--'; const n = parseInt(val as string); if (isNaN(n)) return val; if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`; if (n >= 1000) return `${(n / 1000).toFixed(1)}K`; return n.toLocaleString('pt-BR'); };

DrawerComponent.prototype.destroy = function() { if (this._abortController) { this._abortController.abort(); this._abortController = null; } if (this.overlay) this.overlay.remove(); if (this.drawer) this.drawer.remove(); this.overlay = null; this.drawer = null; this.isOpen = false; };

export { DrawerComponent, VERSION, MODULE_ID };
export default DrawerComponent;
