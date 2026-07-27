

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.1.0-P24-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-16-ui-component
// PURPOSE: UIComponent - Panel-16 Fornecedores 360º Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PAINEL_ID, COLUMNS from ../core/constants.js
//   COLUMN_TYPES, INFINITE_SCROLL_CONFIG from ./constants.js
//   EventBusPort from ../ports/index.js
//   emitPanelIntent, PANEL_16_UI_EVENTS from /core/runtime/events/catalog/panels.events.js
//   applyClientFilters, getActiveFiltersCount from ./filters.js
//   sortData from ./sorting.js
//   exportCSV, exportSelected, exportXLSX, exportPDF from ./export.js
//   renderMain, renderControls from ./render/index.js
//   renderContextMenu from ./render/modals.js
//   bindEvents, bindGlobalEvents, unbindGlobalEvents, bindControlsEvents from ./e...
//
// PROVIDES:
//   UIComponent() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_16_UI_EVENTS.FILTER_CHANGE
//   PANEL_16_UI_EVENTS.PERIOD_CHANGE
// LISTENS (eventos):
//   'click'
//   'scroll'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PAINEL_ID, COLUMNS } from '../core/constants.js';
import { COLUMN_TYPES, INFINITE_SCROLL_CONFIG } from './constants.js';
import { EventBusPort } from '../ports/index.js';
import { emitPanelIntent, PANEL_16_UI_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import * as persistence from './persistence.js';
import { applyClientFilters, getActiveFiltersCount } from './filters.js';
import { sortData } from './sorting.js';

// @ts-expect-error TS migration - TS2614, TS2724
import { exportCSV, exportSelected, exportXLSX, exportPDF } from './export.js';
import { renderMain, renderControls } from './render/index.js';

// @ts-expect-error TS migration - TS2614
import { renderContextMenu } from './render/modals.js';
import { bindEvents, bindGlobalEvents, unbindGlobalEvents, bindControlsEvents } from './events.js';

const COMPONENT_VERSION = '9.1.0-P24-ES6';

const SVGS = {
  warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>'
};

export function UIComponent(this: any, container: HTMLElement, logger: Record<string, unknown>, apiClient: Record<string, unknown>, controlsElement: HTMLElement | null) {
  this.container = container;
  this.controlsElement = controlsElement || null;
  this.logger = logger;
  this.apiClient = apiClient;
  this.data = { kpis: null, compare: null, list: [], pagination: { total: 0, page: 1, limit: 30 } };
  this.filters = persistence.loadFilters();
  this.period = 90;
  this.sortColumns = persistence.loadSort();
  this.viewMode = persistence.loadViewMode();
  this.columns = persistence.loadColumns();
  this.savedViews = persistence.loadSavedViews();
  this.activeView = 'default';
  this.groupBy = '';
  this.collapsedGroups = new Set();
  this.selectedFornecedor = null;
  this.selectedRows = new Set();
  this.favorites = persistence.loadFavorites();
  this.focusedRowIndex = -1;
  this.lastUpdate = null;
  this.isLoading = false;
  this.debounceTimer = null;
  this.contextMenu = null;
  this.showColumnsDropdown = false;
  this.showViewsDropdown = false;
  this.showAdvancedFilters = false;
  this.expandedRows = new Set();
  this.pinnedLeft = persistence.loadPinnedCols('left');
  this.pinnedRight = persistence.loadPinnedCols('right');
  this.isExporting = false;
  this.useInfiniteScroll = false;
  this.isLoadingMore = false;
  this.hasMoreData = true;
  this.allLoadedData = [];
  this.clientSearchTerm = '';
  this._boundHandlers = null;
  this._boundScrollHandler = this._handleScroll.bind(this);
}

UIComponent.prototype.init = function() {
  const self = this;
  if (this.logger && this.logger.debug) this.logger.debug('ui.init', { version: COMPONENT_VERSION });
  this._renderControls();
  this._render();
  this._bindEvents();
  this._bindControlsEvents();
  this._boundHandlers = bindGlobalEvents(this, this._createHandlers());
  return Promise.resolve();
};

UIComponent.prototype._getDisplayData = function() {
  const baseData = this.useInfiniteScroll ? this.allLoadedData : this.data.list;
  return applyClientFilters(baseData, this.clientSearchTerm, this.filters);
};

UIComponent.prototype._createHandlers = function() {
  const self = this;
  return {
    container: this.container,
    onRender() { self._render(); self._bindEvents(); },
    onFilterChange() { self._emitFilterChange(); },
    onRefresh() { self._emitRefresh(); },
    onPeriodChange() { self._emitPeriodChange(); },
    getDisplayData() { return self._getDisplayData(); },
    saveFilters() { persistence.saveFilters(self.filters); },
    saveSort() { persistence.saveSort(self.sortColumns); },
    saveViewMode() { persistence.saveViewMode(self.viewMode); },
    saveColumns() { persistence.saveColumns(self.columns); },
    saveFavorites() { persistence.saveFavorites(self.favorites); },
    sortData() { sortData(self.useInfiniteScroll ? self.allLoadedData : self.data.list, self.sortColumns); },
    resetInfiniteScroll() { self._resetInfiniteScroll(); },
    loadFornecedor360(id: string) { self._loadFornecedor360(id); },
    toggleFavorite(id: string) { self._toggleFavorite(id); },
    toggleExpand(id: string) { self._toggleExpand(id); },
    removeFilter(key: string) { self._removeFilter(key); },
    applyAdvancedFilters() { self._applyAdvancedFilters(); },
    clearAdvancedFilters() { self._clearAdvancedFilters(); },
    exportCSV() { exportCSV(self._getDisplayData()); },
    exportSelected() { exportSelected(self._getDisplayData(), self.selectedRows); },
    exportXLSX() { exportXLSX(self._getDisplayData()); },
    exportPDF() { self._exportPDF(); },
    copyDoc(id: string) { self._copyDoc(id); },
    showContextMenu(x: number, y: number, id: string) { self._showContextMenu(x, y, id); },
    hideContextMenu() { self._hideContextMenu(); },
    renderControls() { self._renderControls(); },
    applyView(id: string) { self._applyView(id); },
    deleteView(id: string) { self._deleteView(id); },
    saveCurrentView() { self._saveCurrentView(); },
    resetColumns() { self._resetColumns(); },
    togglePin(colId: string, side: string) { self._togglePin(colId, side); }
  };
};

UIComponent.prototype._handleScroll = function(e: Event) {
  if (!this.useInfiniteScroll || this.isLoadingMore || !this.hasMoreData) return;
  const container = e.target as HTMLElement;
  const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  if (scrollBottom < INFINITE_SCROLL_CONFIG.threshold) this._loadMoreData();
};

UIComponent.prototype._loadMoreData = function() {
  const self = this;
  if (this.isLoadingMore || !this.hasMoreData) return Promise.resolve();
  this.isLoadingMore = true;
  this._updateLoadingMoreIndicator(true);
  const offset = this.allLoadedData.length;
  return this.apiClient.getList({ search: this.filters.search, status: this.filters.status, uf: this.filters.uf, tipo: this.filters.tipo, limit: INFINITE_SCROLL_CONFIG.batchSize, offset }).then((result: Record<string, unknown>) => {
    if (result.success && result.payload) {
      const payload = result.payload as Record<string, unknown>;
      const newItems = (payload.list || payload.fornecedores || []) as Record<string, unknown>[];
      if (newItems.length === 0 || self.allLoadedData.length >= INFINITE_SCROLL_CONFIG.maxItems) { self.hasMoreData = false; }
      else { self.allLoadedData = self.allLoadedData.concat(newItems); sortData(self.allLoadedData, self.sortColumns); self._render(); self._bindEvents(); }
    } else { self.hasMoreData = false; }
  }).catch((err: Error) => {
    if (self.logger && self.logger.error) self.logger.error('loadMoreData.error', { error: err.message });
    self.hasMoreData = false;
  }).finally(() => {
    self.isLoadingMore = false;
    self._updateLoadingMoreIndicator(false);
  });
};

UIComponent.prototype._updateLoadingMoreIndicator = function(show: boolean) { const indicator = this.container.querySelector('.p16-infinite-loading') as HTMLElement | null; if (indicator) indicator.style.display = show ? 'flex' : 'none'; };
UIComponent.prototype._resetInfiniteScroll = function() { this.allLoadedData = []; this.hasMoreData = true; this.isLoadingMore = false; };

UIComponent.prototype._render = function() {
  const displayData = this._getDisplayData();
  this.container.innerHTML = renderMain(this, displayData);
  this._renderControls();
  if (this.useInfiniteScroll) {
    const scrollContainer = this.container.querySelector('.p16-sticky-wrapper');
    if (scrollContainer) scrollContainer.addEventListener('scroll', this._boundScrollHandler);
  }
};

UIComponent.prototype._renderControls = function() {
  if (!this.controlsElement) return;
  this.controlsElement.innerHTML = renderControls(this, this.savedViews);
  this._bindControlsEvents();
};

UIComponent.prototype._bindEvents = function() { bindEvents(this.container, this, this._createHandlers()); };
UIComponent.prototype._bindControlsEvents = function() { bindControlsEvents(this.controlsElement, this, this._createHandlers()); };

UIComponent.prototype._loadFornecedor360 = function(id: string) {
  const self = this;
  return this.apiClient.getFornecedor360(id).then((result: Record<string, unknown>) => {
    if (result.success && result.payload) { self.selectedFornecedor = result.payload; self._render(); self._bindEvents(); }
  }).catch((err: Error) => {
    if (self.logger && self.logger.error) self.logger.error('loadFornecedor360.error', { id, error: err.message });
  });
};

UIComponent.prototype._toggleFavorite = function(id: string) { this.favorites.has(id) ? this.favorites.delete(id) : this.favorites.add(id); persistence.saveFavorites(this.favorites); this._render(); this._bindEvents(); };
UIComponent.prototype._toggleExpand = function(id: string) { this.expandedRows.has(id) ? this.expandedRows.delete(id) : this.expandedRows.add(id); this._render(); this._bindEvents(); };

UIComponent.prototype._removeFilter = function(key: string) {
  if (key === 'clientSearch') this.clientSearchTerm = '';
  else { delete this.filters[key]; persistence.saveFilters(this.filters); }
  this.data.pagination.page = 1;
  this._resetInfiniteScroll();
  if (key !== 'clientSearch') this._emitFilterChange();
  else { this._render(); this._bindEvents(); }
};

UIComponent.prototype._applyAdvancedFilters = function() {
  const getVal = (id: string) => { const el = document.getElementById(id); return el ? (el as HTMLInputElement).value : ''; };
  this.filters.valorMin = getVal('p16-adv-valor-min');
  this.filters.valorMax = getVal('p16-adv-valor-max');
  this.filters.valorMinClient = getVal('p16-adv-valor-min-client');
  this.filters.valorMaxClient = getVal('p16-adv-valor-max-client');
  this.filters.reqMinClient = getVal('p16-adv-req-min-client');
  this.filters.reqMaxClient = getVal('p16-adv-req-max-client');
  this.filters.risco = getVal('p16-adv-risco');
  this.filters.temPix = getVal('p16-adv-pix');
  persistence.saveFilters(this.filters);
  this.showAdvancedFilters = false;
  this.data.pagination.page = 1;
  this._resetInfiniteScroll();
  this._emitFilterChange();
};

UIComponent.prototype._clearAdvancedFilters = function() {
  const self = this;
  ['valorMin', 'valorMax', 'valorMinClient', 'valorMaxClient', 'reqMinClient', 'reqMaxClient', 'risco', 'temPix'].forEach(k => { delete self.filters[k]; });
  persistence.saveFilters(this.filters);
  this.showAdvancedFilters = false;
  this._render(); this._bindEvents();
};

UIComponent.prototype._copyDoc = function(id: string) {
  const displayData = this._getDisplayData();
  const f = displayData.find((item: Record<string, unknown>) => item.id === id);
  if (navigator.clipboard) navigator.clipboard.writeText((f && (f.cnpj || f.cpf)) || '');
};

UIComponent.prototype._exportPDF = function() {
  const self = this;
  this.isExporting = true; this._render(); this._bindEvents();
  return exportPDF(this._getDisplayData(), this.data.kpis, this.logger).then(() => {
    self.isExporting = false; self._render(); self._bindEvents();
  });
};

UIComponent.prototype._applyView = function(viewId: string) {
  const self = this;
  const view = this.savedViews.find((v: Record<string, unknown>) => v.id === viewId);
  if (!view) return;
  this.activeView = viewId;
  if (view.filters) { this.filters = Object.assign({}, view.filters); persistence.saveFilters(this.filters); }
  if (view.columns) { this.columns.forEach((c: Record<string, unknown>) => { c.visible = c.locked || (view.columns as string[]).includes(c.id as string); }); persistence.saveColumns(this.columns); }
  this.showViewsDropdown = false;
  this._resetInfiniteScroll();
  this._emitFilterChange();
};

UIComponent.prototype._saveCurrentView = function() {
  const name = prompt('Nome da visão:');
  if (!name) return;
  const id = `custom_${Date.now()}`;
  this.savedViews.push({ id, name, icon: 'bookmark', desc: 'Visão personalizada', filters: Object.assign({}, this.filters), columns: this.columns.filter((c: Record<string, unknown>) => c.visible).map((c: Record<string, unknown>) => c.id) });
  persistence.saveSavedViews(this.savedViews);
  this.activeView = id;
  this.showViewsDropdown = false;
  this._renderControls();
};

UIComponent.prototype._deleteView = function(viewId: string) {
  this.savedViews = this.savedViews.filter((v: Record<string, unknown>) => v.id !== viewId);
  persistence.saveSavedViews(this.savedViews);
  if (this.activeView === viewId) this.activeView = 'default';
  this._renderControls();
};

UIComponent.prototype._resetColumns = function() {
  this.columns = COLUMNS.map((c: Record<string, unknown>) => Object.assign({}, c, (COLUMN_TYPES as Record<string, unknown>)[c.id as string] || {}));
  persistence.saveColumns(this.columns);
  this.pinnedLeft = new Set(['checkbox', 'nome']);
  this.pinnedRight = new Set(['action']);
  persistence.savePinnedCols(this.pinnedLeft, this.pinnedRight);
  this._render(); this._bindEvents();
};

UIComponent.prototype._togglePin = function(colId: string, side: string) {
  if (side === 'left') {
    if (this.pinnedLeft.has(colId)) this.pinnedLeft.delete(colId);
    else { this.pinnedRight.delete(colId); this.pinnedLeft.add(colId); }
  } else {
    if (this.pinnedRight.has(colId)) this.pinnedRight.delete(colId);
    else { this.pinnedLeft.delete(colId); this.pinnedRight.add(colId); }
  }
  persistence.savePinnedCols(this.pinnedLeft, this.pinnedRight);
  this._render(); this._bindEvents();
};

UIComponent.prototype._showContextMenu = function(x: number, y: number, fornecedorId: string) {
  const self = this;
  this._hideContextMenu();
  const displayData = this._getDisplayData();
  const f = displayData.find((item: Record<string, unknown>) => item.id === fornecedorId);
  if (!f) return;
  const menu = renderContextMenu(x, y, f, this.favorites, this.expandedRows, this.selectedRows);
  document.body.appendChild(menu);
  this.contextMenu = menu;
  menu.addEventListener('click', (e: MouseEvent) => {
    const item = (e.target as Element).closest('[data-ctx]');
    if (!item) return;
    self._handleContextAction((item as HTMLElement).dataset.ctx, (item as HTMLElement).dataset.id);
    self._hideContextMenu();
  });
};

UIComponent.prototype._hideContextMenu = function() { if (this.contextMenu) { this.contextMenu.remove(); this.contextMenu = null; } };

UIComponent.prototype._handleContextAction = function(action: string, id: string) {
  const displayData = this._getDisplayData();
  const f = displayData.find((item: Record<string, unknown>) => item.id === id);
  switch (action) {
    case 'view': this._loadFornecedor360(id); break;
    case 'expand': this._toggleExpand(id); break;
    case 'favorite': this._toggleFavorite(id); break;
    case 'copy-doc': if (navigator.clipboard) navigator.clipboard.writeText((f && (f.cnpj || f.cpf)) || ''); break;
    case 'copy-nome': if (navigator.clipboard) navigator.clipboard.writeText((f && f.nome) || ''); break;
    case 'select': this.selectedRows.has(id) ? this.selectedRows.delete(id) : this.selectedRows.add(id); this._render(); this._bindEvents(); break;
  }
};

// P24: Events via tokens fixos
UIComponent.prototype._emitFilterChange = function() { EventBusPort.emit(PANEL_16_UI_EVENTS.FILTER_CHANGE, { filters: this.filters, pagination: { page: this.data.pagination.page, limit: this.data.pagination.limit }, source: 'panel-16:ui:component', timestamp: Date.now() }); };
UIComponent.prototype._emitPeriodChange = function() { EventBusPort.emit(PANEL_16_UI_EVENTS.PERIOD_CHANGE, { period: this.period, source: 'panel-16:ui:component', timestamp: Date.now() }); };
UIComponent.prototype._emitRefresh = () => { emitPanelIntent('REFRESH', PAINEL_ID); };

UIComponent.prototype.update = function(payload: Record<string, unknown>) {
  if (!payload) return;
  this.lastUpdate = Date.now();
  this.isLoading = false;
  if (payload.kpis) { this.data.kpis = payload.kpis; this.data.kpis.by_status = payload.by_status; this.data.kpis.by_uf = payload.by_uf; this.data.kpis.top_valor = payload.top_valor; }
  if (payload.compare) this.data.compare = payload.compare;
  const list = payload.list || payload.fornecedores;
  if (list) {
    this.data.list = list;
    const pag = payload.pagination || {};
    this.data.pagination.total = (pag as Record<string, unknown>).total || payload.total || (list as unknown[]).length;
    if ((pag as Record<string, unknown>).page || payload.page) this.data.pagination.page = (pag as Record<string, unknown>).page || payload.page;
    if ((pag as Record<string, unknown>).limit) this.data.pagination.limit = (pag as Record<string, unknown>).limit;
    if (this.useInfiniteScroll && this.allLoadedData.length === 0) { this.allLoadedData = (list as unknown[]).slice(); this.hasMoreData = (list as unknown[]).length < this.data.pagination.total; }
    sortData(this.data.list, this.sortColumns);
  }
  this._render();
  this._bindEvents();
};

UIComponent.prototype.showLoading = function() { this.isLoading = true; this._render(); this._bindEvents(); };

UIComponent.prototype.showError = function(msg: string) {
  this.isLoading = false;
  const el = this.container.querySelector('#p16-table');
  if (el) el.innerHTML = `<div class="p16-error" role="alert"><div class="p16-error-icon" aria-hidden="true">${SVGS.warning}</div><h3 class="p16-error-title">Erro ao carregar dados</h3><p class="p16-error-message">${msg || 'Tente novamente em alguns instantes'}</p><button class="p16-error-retry" data-action="refresh">${SVGS.refresh} Tentar novamente</button></div>`;
};

UIComponent.prototype.destroy = function() {
  if (this._boundHandlers) unbindGlobalEvents(this._boundHandlers);
  const scrollContainer = this.container.querySelector('.p16-sticky-wrapper');
  if (scrollContainer) scrollContainer.removeEventListener('scroll', this._boundScrollHandler);
  clearTimeout(this.debounceTimer);
  this._hideContextMenu();
  this.container.innerHTML = '';
  return Promise.resolve();
};

UIComponent.prototype.getVersion = () => COMPONENT_VERSION;

UIComponent.prototype.info = function() {
  return {
    version: COMPONENT_VERSION,
    features: ['modular-architecture', 'header-controls-integrado', 'multi-column-sorting', 'filter-chips', 'aria-accessibility', 'row-expansion', 'column-pinning', 'export-pdf', 'sticky-header', 'infinite-scroll', 'client-side-filtering', 'column-typing', 'ports-injection'],
    sortColumns: this.sortColumns,
    expandedRows: Array.from(this.expandedRows),
    pinnedLeft: Array.from(this.pinnedLeft),
    pinnedRight: Array.from(this.pinnedRight),
    activeFilters: getActiveFiltersCount(this.filters),
    useInfiniteScroll: this.useInfiniteScroll,
    loadedCount: this.allLoadedData.length,
    clientSearchTerm: this.clientSearchTerm
  };
};

export default UIComponent;

export const MODULE_ID = 'panels-panel-16-ui-component';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { componentReady: true }, p24Instrumented: true, timestamp: Date.now() }; }
