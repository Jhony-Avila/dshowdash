// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02.ui.component
// PURPOSE: UIComponent - Panel-02 Enterprise Modular
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   loadSavedFilters, applyFiltersToDOM, clearFiltersState, clearFiltersDOM, appl...
//   updateSelectionUI, updateBulkBar from ./selection.js
//   handleJobAction from ./actions.js
//   setupFilterListeners, setupRowClickListener, setupContextMenuListener, setupE...
//   renderSkeleton from ./render/skeleton.js
//   renderEmpty from ./render/empty.js
//   renderError from ./render/error.js
//   TableComponent from ./table.js
//   DrawerComponent from ./drawer.js
//   KeyboardNavigation from ./keyboard.js
//   ToastManager from ./toast.js
//   ToolbarComponent from ./toolbar.js
//   ContextMenu from ./context-menu.js
//   PaginationComponent from ./pagination.js
//   ExportManager from ../utils/export.js
//   ... and 3 more imports
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
//   window.print
// ═══════════════════════════════════════════════════════════════
'use strict';


import { loadSavedFilters, applyFiltersToDOM, clearFiltersState, clearFiltersDOM, applyFilters as filterJobs, persistFilters } from './filters.js';
import { updateSelectionUI, updateBulkBar } from './selection.js';
import { handleJobAction } from './actions.js';
import { setupFilterListeners, setupRowClickListener, setupContextMenuListener, setupExportListener, setupSelectionListeners, setupInlineActionListeners, removeFilterListeners, removeExportListener, removeContainerListeners } from './events.js';
import { renderSkeleton } from './render/skeleton.js';
import { renderEmpty } from './render/empty.js';
import { renderError } from './render/error.js';

import { TableComponent } from './table.js';

// @ts-expect-error TS migration - TS2614
import { DrawerComponent } from './drawer.js';
import { KeyboardNavigation } from './keyboard.js';
import { ToastManager } from './toast.js';
import { ToolbarComponent } from './toolbar.js';
import { ContextMenu } from './context-menu.js';
import { PaginationComponent } from './pagination.js';
import { ExportManager } from '../utils/export.js';
import { FilterStorage } from '../utils/storage.js';
import { URLState } from '../utils/url-state.js';
import { updateStatusBadges, updateFooterStats, updateFilterCount } from '../core/template.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-02.ui.component';

// P17WI: Ports injetados via PortsFactory
let _ports: Record<string, unknown> | null = null;
export function injectPorts(ports: Record<string, unknown>) { _ports = ports; }
export function getPorts() { return _ports; }
function _getPort(name: string) { return _ports?.[name] || null; }

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement | null, logger: Record<string, unknown> | null) {
    this.container = container;
    this.logger = logger;
    this.mounted = false;
    this.tableComponent = null;
    this.drawerComponent = null;
    this.keyboardNav = null;
    this.toastManager = null;
    this.toolbarComponent = null;
    this.contextMenu = null;
    this.paginationComponent = null;
    this.exportManager = null;
    this.filterStorage = null;
    this.urlState = null;
    this.rootContainer = null;
    this.allJobs = [];
    this.filteredJobs = [];
    this.paginatedJobs = [];
    this.selectedJobs = new Set();
    this.previousHealthMap = new Map();
    this.overview = null;
    this.filters = { type: '', status: '', rate: '', search: '' };
    this.inlineFilters = {};
    this.hasRenderedContent = false;
    this._handlers = {};
  }

  async init() {
    if (!this.container) { this.logger?.error?.('ui.no-container'); return; }
    this.rootContainer = this.container.closest('.p02-wrapper') || this.container.closest('[data-painel-id="panel-02"]');
    this.toastManager = new ToastManager();
    this.exportManager = new ExportManager(this.logger);
    this.filterStorage = new FilterStorage(this.logger);
    this.urlState = new (URLState as unknown as new (...a: unknown[]) => unknown)(this.logger);
    this.drawerComponent = new DrawerComponent(this.logger, { onAction: (action: string, job: Record<string, unknown>) => this._handleJobAction(action, job) });
    this.contextMenu = new ContextMenu({ onAction: (action: string, job: Record<string, unknown>) => this._handleJobAction(action, job) });
    this.keyboardNav = new KeyboardNavigation(this.container, {
      onRowSelect: (row: HTMLElement) => this.logger?.debug?.('keyboard.select', { jobId: (row as HTMLElement & { dataset: DOMStringMap }).dataset.jobId }),
      onRowActivate: (row: HTMLElement) => { const jobId = (row as HTMLElement & { dataset: DOMStringMap }).dataset.jobId; const job = this.allJobs.find((j: Record<string, unknown>) => String(j.id) === String(jobId)); if (job) this.drawerComponent?.open(job); }
    });
    this.filters = loadSavedFilters(this.urlState, this.filterStorage, this.filters);
    applyFiltersToDOM(this.rootContainer, this.filters);
    this._setupListeners();
    this.mounted = true;
    this.logger?.debug?.('ui.init', { version: VERSION });
  }

  _setupListeners() {
    const state = { allJobs: this.allJobs, filteredJobs: this.filteredJobs, paginatedJobs: this.paginatedJobs, selectedJobs: this.selectedJobs, filters: this.filters };
    const handlers = this._createHandlers();
    this._handlers.filterHandler = setupFilterListeners(this.rootContainer, state, handlers);
    this._handlers.rowClickHandler = setupRowClickListener(this.container, state, handlers);
    this._handlers.contextHandler = setupContextMenuListener(this.container, state, handlers);
    this._handlers.exportHandler = setupExportListener(this.rootContainer, state, handlers);
    this._handlers.selectHandler = setupSelectionListeners(this.container, state, handlers);
    this._handlers.inlineActionHandler = setupInlineActionListeners(this.container, state, handlers);
  }

  _createHandlers() {
    return { drawerComponent: this.drawerComponent, contextMenu: this.contextMenu, toastManager: this.toastManager, exportManager: this.exportManager, logger: this.logger, rootContainer: this.rootContainer, applyFilters: () => this.applyFilters(), persistFilters: () => persistFilters(this.filterStorage, this.urlState, this.filters), clearFilters: () => this.clearFilters() };
  }

  _handleJobAction(action: string, job: Record<string, unknown>) { handleJobAction(action, job, this._createHandlers()); }

  handleInlineFilter(inlineFilters: Record<string, string>) { this.inlineFilters = inlineFilters; this.applyFilters(); }

  clearFilters() {
    this.filters = clearFiltersState();
    this.inlineFilters = {};
    clearFiltersDOM(this.rootContainer);
    this.filterStorage.clear();
    this.urlState.clear();
    this.applyFilters();
    this.toastManager.info('Filtros limpos');
  }

  applyFilters() {
    if (!this.allJobs.length) return;
    this.filteredJobs = filterJobs(this.allJobs, this.filters, this.inlineFilters);
    if (this.paginationComponent) { this.paginationComponent.setTotal(this.filteredJobs.length); this.paginationComponent.goTo(1); }
    else { this.paginatedJobs = this.filteredJobs; this.renderFilteredTable(); }
    updateFilterCount(this.rootContainer, this.filteredJobs.length, this.allJobs.length);
    this.keyboardNav?.reset();
  }

  renderFilteredTable() {
    const tableInDOM = this.tableComponent?.element && document.contains(this.tableComponent.element);
    if (!this.tableComponent || !tableInDOM) {
      this.container.innerHTML = '';
      this.tableComponent = new TableComponent(this.container, this.logger);
      this.tableComponent.onInlineFilter = (filters: Record<string, string>) => this.handleInlineFilter(filters);
      this.tableComponent.render();
      if (!this.toolbarComponent) {
        this.toolbarComponent = new ToolbarComponent(this.container, {
          columns: this.tableComponent.getColumns(),
          onDensityChange: (density: string) => this.tableComponent?.setDensity(density),
          onColumnToggle: (colId: string, visible: boolean) => this.tableComponent?.setColumnVisibility(colId, visible),
          onGroupByChange: (field: string | null) => this.tableComponent?.setGroupBy(field),
          onInlineFiltersToggle: (show: boolean) => this.tableComponent?.toggleInlineFilters(show),
          onPrint: () => this._handlePrint(),
          onShare: () => this._handleShare()
        });
        this.toolbarComponent.render();
      }
      if (!this.paginationComponent) {
        this.paginationComponent = new PaginationComponent({
          onPageChange: (page: number, start: number, end: number) => { this.paginatedJobs = this.filteredJobs.slice(start, end); this.tableComponent?.update(this.paginatedJobs); this._updateSelectionUI(); },
          onPageSizeChange: (size: number) => this.logger?.debug?.('page-size', { size })
        });
        this.paginationComponent.render(this.container);
      }
      this.keyboardNav?.init();
    }
    if (this.paginationComponent) {
      this.paginationComponent.setTotal(this.filteredJobs.length);
      const start = this.paginationComponent.startIndex;
      const end = this.paginationComponent.endIndex;
      this.paginatedJobs = this.filteredJobs.slice(start, end);
    } else { this.paginatedJobs = this.filteredJobs; }
    this.tableComponent.update(this.paginatedJobs);
    this.hasRenderedContent = true;
    this._updateSelectionUI();
  }

  _updateSelectionUI() { updateSelectionUI(this.container, this.paginatedJobs, this.selectedJobs); updateBulkBar(this.rootContainer, this.selectedJobs); }

  _handlePrint() { this.toastManager?.info('Preparando impressao...'); setTimeout(() => window.print(), 300); }

  _handleShare() {
    // P17WI: Usa port routeState injetado via PortsFactory
    const rs = _getPort('routeState') as { getShareableURL?: (panelId: string, filters: Record<string, string>) => string } | null;
    let url = '';
    if (rs && rs.getShareableURL) { url = rs.getShareableURL('panel-02', this.filters); }
    else if (this.urlState && this.urlState.getShareableURL) { url = this.urlState.getShareableURL(this.filters); }
    else if (typeof window !== 'undefined') { url = window.location.href; }
    if (navigator.clipboard && url) { navigator.clipboard.writeText(url); this.toastManager?.success('Link copiado para a area de transferencia'); }
    else { this.toastManager?.info(`Copie o link: ${url}`); }
  }

  showLoading() { if (this.hasRenderedContent) return; if (!this.container) return; this.container.innerHTML = renderSkeleton(); this.tableComponent = null; this.toolbarComponent = null; this.paginationComponent = null; }

  showError(message: string) {
    if (this.hasRenderedContent) { this.toastManager?.error(message || 'Erro ao carregar dados'); return; }
    if (!this.container) return;
    this.container.innerHTML = renderError(message);
    this.tableComponent = null;
    this.hasRenderedContent = false;
  }

  showEmpty() { if (!this.container) return; this.container.innerHTML = renderEmpty(); this.tableComponent = null; }

  update(data: Record<string, unknown>) {
    if (!this.container) return;
    try {
      const payload = (data?.data || data?.payload || data) as Record<string, unknown>;
      this.overview = payload?.overview || null;
      const statusCounts = payload?.status_counts || null;
      const jobs = (payload?.jobs || (Array.isArray(payload) ? payload : null)) as Record<string, unknown>[] | null;
      if (!jobs || jobs.length === 0) { this.allJobs = []; this.filteredJobs = []; if (!this.hasRenderedContent) this.showEmpty(); updateFilterCount(this.rootContainer, 0, 0); this._updateHeaderBadges({ ok: 0, warning: 0, error: 0 }); return; }
      this._checkStatusChanges(jobs);
      this.allJobs = jobs;
      this.applyFilters();
      if (statusCounts) this._updateHeaderBadges(statusCounts as Record<string, unknown>);
      else this._updateHeaderBadgesFromJobs(jobs);
      if (this.overview) this._updateFooter(this.overview);
      else this._updateFooterFromJobs(jobs);
    } catch (error: any) { this.logger?.error?.('ui.render-error', { error: error.message }); if (!this.hasRenderedContent) this.showError('Erro ao renderizar dados'); }
  }

  _checkStatusChanges(newJobs: Record<string, unknown>[]) {
    if (this.previousHealthMap.size === 0) { newJobs.forEach((job: Record<string, unknown>) => this.previousHealthMap.set(String(job.id), job.health_status)); return; }
    newJobs.forEach((job: Record<string, unknown>) => {
      const jobId = String(job.id);
      const prevHealth = this.previousHealthMap.get(jobId);
      const currHealth = job.health_status;
      if (prevHealth && prevHealth !== currHealth) {
        const jobName = job.job_name || job.name || `Job ${jobId}`;
        if (currHealth === 'critical') this.toastManager?.error(`${jobName} entrou em estado CRITICO`);
        else if (currHealth === 'warning' && prevHealth === 'healthy') this.toastManager?.warning(`${jobName} requer atencao`);
        else if (currHealth === 'healthy' && (prevHealth === 'critical' || prevHealth === 'warning')) this.toastManager?.success(`${jobName} voltou ao normal`);
      }
      this.previousHealthMap.set(jobId, currHealth);
    });
  }

  _updateHeaderBadges(counts: Record<string, unknown>) { if (!this.rootContainer) return; updateStatusBadges(this.rootContainer, { ok: counts.ok ?? 0, warning: counts.warning ?? 0, error: counts.error ?? 0 }); }

  _updateHeaderBadgesFromJobs(jobs: Record<string, unknown>[]) {
    if (!this.rootContainer) return;
    const stats = { ok: 0, warning: 0, error: 0 };
    jobs.forEach((job: Record<string, unknown>) => { const status = job.health_status || 'inactive'; if (status === 'healthy') stats.ok++; else if (status === 'warning') stats.warning++; else if (status === 'critical') stats.error++; });
    updateStatusBadges(this.rootContainer, stats);
  }

  _updateFooter(overview: Record<string, unknown>) { if (!this.rootContainer) return; updateFooterStats(this.rootContainer, { total: overview.total_jobs ?? '--', active: overview.active_jobs ?? '--', inactive: overview.inactive_jobs ?? '--' }); }

  _updateFooterFromJobs(jobs: Record<string, unknown>[]) { if (!this.rootContainer) return; updateFooterStats(this.rootContainer, { total: jobs.length, active: jobs.filter((j: Record<string, unknown>) => j.is_active == 1).length, inactive: jobs.filter((j: Record<string, unknown>) => j.is_active == 0).length }); }

  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, mounted: this.mounted, hasData: this.hasRenderedContent }; }

  info() { return { version: VERSION, moduleId: MODULE_ID, features: ['modular-architecture', 'inline-filters', 'grouping', 'aria', 'bulk-actions', 'export', 'pagination', 'keyboard-nav'], mounted: this.mounted, jobsCount: this.allJobs.length, filteredCount: this.filteredJobs.length, selectedCount: this.selectedJobs.size }; }

  async destroy() {
    removeFilterListeners(this.rootContainer, this._handlers.filterHandler);
    removeExportListener(this.rootContainer, this._handlers.exportHandler);
    removeContainerListeners(this.container, this._handlers);
    this.keyboardNav?.destroy();
    this.drawerComponent?.destroy();
    this.toastManager?.destroy();
    this.toolbarComponent?.destroy();
    this.contextMenu?.destroy();
    this.paginationComponent?.destroy();
    this.tableComponent?.destroy();
    this.keyboardNav = null; this.drawerComponent = null; this.toastManager = null; this.toolbarComponent = null; this.contextMenu = null; this.paginationComponent = null; this.tableComponent = null;
    this.allJobs = []; this.filteredJobs = []; this.paginatedJobs = []; this.selectedJobs.clear(); this.previousHealthMap.clear(); this.overview = null; this.hasRenderedContent = false; this.mounted = false;
  }
}

export default UIComponent;
