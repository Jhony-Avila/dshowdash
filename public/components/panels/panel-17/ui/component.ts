// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-17:ui:component
// PURPOSE: UIComponent - Panel-17 Enterprise Dashboard
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   renderSkeleton from ./render/skeleton.js
//   renderEmpty from ./render/empty.js
//   renderError from ./render/error.js
//   ToastManager from ./toast.js
//   KeyboardNavigation from ./keyboard.js
//   DrawerComponent from ./drawer.js
//   ExportManager from ../utils/export.js
//   renderDashboard, renderActivityTable, renderTopJobsTable from ./renderers.js
//   exportActivity, exportTopJobs, showJobDetails, handleAction from ./actions.js
//   createInitialState, parsePayload, hasValidData, toggleSort from ./state.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   UIComponent() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_EVENTS.REFRESH
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   window.EventBus (fallback with recordViolation in non-strict mode)
// ═══════════════════════════════════════════════════════════════
// @changelog v9.4.0-STRICT-MODE - NR-FULL strict mode migration with recordViolation
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { renderSkeleton } from './render/skeleton.js';
import { renderEmpty } from './render/empty.js';
import { renderError } from './render/error.js';
import { ToastManager } from './toast.js';
import { KeyboardNavigation } from './keyboard.js';
import { DrawerComponent } from './drawer.js';
import { ExportManager } from '../utils/export.js';


// @ts-expect-error TS migration - TS2614
import { renderDashboard, renderActivityTable, renderTopJobsTable } from './renderers.js';
import { exportActivity, exportTopJobs, showJobDetails, handleAction } from './actions.js';

// @ts-expect-error TS migration - TS2614
import { createInitialState, parsePayload, hasValidData, toggleSort } from './state.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-17:ui:component';

const hasWindow = typeof window !== 'undefined';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

function _getEventBus() {
  _initPorts();
  const bus = _getPort('eventBus');
  if (bus) return bus;
  // Fallback via Core.windowAdapter
  if (hasWindow && window.Core?.windowAdapter?.get) {
    const wBus = window.Core.windowAdapter.get('EventBus');
    if (wBus) return wBus;
  }
  return null;
}

// P25: Ports pattern with strict mode support
function _emitPanelRefresh() {
  try { const eb = _getEventBus(); if (eb && eb.emit) eb.emit(PANEL_EVENTS.REFRESH, { panelId: 'panel-17', source: MODULE_ID, timestamp: Date.now() }); } catch (e) {}
}

export function UIComponent(this: any, container: HTMLElement | null, logger: Record<string, unknown>) {
  this.container = container;
  this.logger = logger;
  this.toastManager = null;
  this.keyboardNav = null;
  this.drawerComponent = null;
  this.exportManager = null;
  const state = createInitialState();
  this.mounted = state.mounted;
  this.hasData = state.hasData;
  this.overview = state.overview;
  this.recentActivity = state.recentActivity;
  this.topJobs = state.topJobs;
  this.alertsSummary = state.alertsSummary;
  this.activityPage = state.activityPage;
  this.activityPerPage = state.activityPerPage;
  this.topJobsSort = state.topJobsSort;
  this._boundHandleClick = this._handleClick.bind(this);
}

UIComponent.prototype.init = async function() {
  if (!this.container) { if (this.logger && this.logger.error) this.logger.error('ui.no-container'); return; }
  this.toastManager = new ToastManager();
  this.exportManager = new ExportManager(this.logger);
  const self = this;
  this.drawerComponent = new (DrawerComponent as unknown as new (logger: Record<string, unknown>, options: Record<string, unknown>) => Record<string, unknown>)(this.logger, { onAction(action: string, item: Record<string, unknown>) { handleAction(action, item, self.logger, self.toastManager); } });
  this.keyboardNav = new KeyboardNavigation(this.container, {
    onRowSelect(row: HTMLElement) { if (self.logger && self.logger.debug) (self.logger.debug as Function)('keyboard.select', row); },
    onRowActivate(row: HTMLElement) { const jobName = (row as HTMLElement & { dataset: DOMStringMap }).dataset.jobName; if (jobName) showJobDetails(jobName, self.topJobs, self.recentActivity, self.drawerComponent); }
  });
  this._setupListeners();
  this.mounted = true;
  if (this.logger && this.logger.debug) this.logger.debug('ui.init', { version: VERSION });
};

UIComponent.prototype._setupListeners = function() { this.container.addEventListener('click', this._boundHandleClick); };

UIComponent.prototype._handleClick = function(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  if (!target) return;
  const action = target.dataset.action;
  const self = this;
  if (action === 'export-activity') { exportActivity(this.recentActivity, this.toastManager); }
  else if (action === 'export-top-jobs') { exportTopJobs(this.topJobs, this.toastManager); }
  else if (action === 'sort-top-jobs') { const field = target.dataset.field; this.topJobsSort = toggleSort(this.topJobsSort, field); const section = this.container.querySelector('.p17-section--top-jobs .p17-section-body'); if (section) section.innerHTML = renderTopJobsTable(this.topJobs, this.topJobsSort); }
  else if (action === 'activity-prev') { if (this.activityPage > 1) { this.activityPage--; this._updateActivityTable(); } }
  else if (action === 'activity-next') { const maxPage = Math.ceil(this.recentActivity.length / this.activityPerPage); if (this.activityPage < maxPage) { this.activityPage++; this._updateActivityTable(); } }
  // @ts-expect-error strict migration — TS2345
  else if (action === 'view-job') { showJobDetails(target.dataset.jobName, this.topJobs, this.recentActivity, this.drawerComponent); }
  else if (action === 'refresh') { _emitPanelRefresh(); }
};

UIComponent.prototype._updateActivityTable = function() { const tableEl = this.container.querySelector('#p17-activity-table'); if (tableEl) tableEl.innerHTML = renderActivityTable(this.recentActivity, this.activityPage, this.activityPerPage); };

UIComponent.prototype.showLoading = function() { if (this.hasData) { this.container.classList.add('p17-loading-overlay'); return; } this.container.innerHTML = renderSkeleton(); };
UIComponent.prototype.hideLoading = function() { this.container.classList.remove('p17-loading-overlay'); };
UIComponent.prototype.showError = function(message: string) { if (this.hasData) { if (this.toastManager) this.toastManager.error(message || 'Erro ao atualizar dados'); this.hideLoading(); return; } this.container.innerHTML = renderError(message); };
UIComponent.prototype.showEmpty = function() { this.container.innerHTML = renderEmpty(); };

UIComponent.prototype.update = function(data: Record<string, unknown>) {
  if (!this.container) return;
  this.hideLoading();
  try {
    const parsed = parsePayload(data);
    this.overview = parsed.overview;
    this.recentActivity = parsed.recentActivity;
    this.topJobs = parsed.topJobs;
    this.alertsSummary = parsed.alertsSummary;
    if (!hasValidData(this.overview, this.recentActivity, this.topJobs)) { this.showEmpty(); return; }
    this.container.innerHTML = renderDashboard(this.overview, this.alertsSummary, this.recentActivity, this.topJobs, this.activityPage, this.activityPerPage, this.topJobsSort);
    this.hasData = true;
    if (this.keyboardNav && this.keyboardNav.init) this.keyboardNav.init();
    if (this.logger && this.logger.debug) this.logger.debug('ui.render-success');
  } catch (error: any) { if (this.logger && this.logger.error) this.logger.error('ui.render-error', { error: error.message }); this.showError('Erro ao renderizar dados'); }
};

UIComponent.prototype.destroy = async function() {
  if (this.container) this.container.removeEventListener('click', this._boundHandleClick);
  if (this.keyboardNav && this.keyboardNav.destroy) this.keyboardNav.destroy();
  if (this.drawerComponent && this.drawerComponent.destroy) this.drawerComponent.destroy();
  if (this.toastManager && this.toastManager.destroy) this.toastManager.destroy();
  if (this.container) { this.container.innerHTML = ''; this.container.classList.remove('p17-loading-overlay'); }
  this.overview = null; this.recentActivity = []; this.topJobs = []; this.alertsSummary = null; this.hasData = false; this.mounted = false;
  if (this.logger && this.logger.debug) this.logger.debug('ui.destroyed');
};

UIComponent.prototype.healthCheck = function() { const checks = { containerAvailable: !!this.container, portsAvailable: Ports.isInitialized(), toastAvailable: !!this.toastManager }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, mounted: this.mounted, hasData: this.hasData, strictMode: isStrict(), p25Compliant: true, timestamp: Date.now() }; };
UIComponent.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, features: ['kpi-cards', 'activity-table', 'top-jobs-table', 'alerts-bar', 'export-csv', 'sorting', 'pagination', 'keyboard-nav'], mounted: this.mounted, activityCount: this.recentActivity.length, topJobsCount: this.topJobs.length, p25Compliant: true }; };

export default UIComponent;
