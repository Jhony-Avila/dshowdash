

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.table-engine
// PURPOSE: Table engine with filtering, editing, export and responsive views
// ───────────────────────────────────────────────────────────────
// @contract INIT - init() initializes table engine
// @contract RENDER - render() renders table
// @contract DESTROY - destroy() destroys table engine
// @contract SET_DATA - setData(data) sets table data
// @contract GET_DATA - getData() gets table data
// @contract SET_COLUMNS - setColumns(columns) sets columns
// @contract SET_FILTERS - setFilters(filters) sets filters
// @contract ADD_FILTER - addFilter(filter) adds filter
// @contract REMOVE_FILTER - removeFilter(column) removes filter
// @contract CLEAR_FILTERS - clearFilters() clears all filters
// @contract SET_GLOBAL_FILTER - setGlobalFilter(query) sets global search
// @contract UNDO - undo() undoes last edit
// @contract REDO - redo() redoes last undo
// @contract SAVE_ALL - saveAll() saves all changes
// @contract REVERT_ALL - revertAll() reverts all changes
// @contract DELETE_ROWS - deleteRows(ids) deletes rows
// @contract EXPORT_TO_CSV - exportToCSV(options) exports to CSV
// @contract EXPORT_TO_EXCEL - exportToExcel(options) exports to Excel
// @contract EXPORT_TO_PDF - exportToPDF(options) exports to PDF
// @contract PRINT - print(options) prints table
// @contract COPY_TO_CLIPBOARD - copyToClipboard(options) copies to clipboard
// @contract SET_VIEW - setView(view) sets view mode (table/card)
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createUiPorts from /core/runtime/ports-profiles.js
//   TABLE_EVENTS from /core/runtime/events/index.js
//   VERSION, MODULE_ID, DEFAULT_CSS_PREFIX, DEFAULTS
//     from ./constants.js
//   TableState from ./state/store.js
//   applyEventEmitter from ./core/events.js
//   formatters from ./utils/formatters.js
//   telemetry from ./telemetry/tracker.js
//   SelectionMixin, SearchMixin, ColumnsMixin,
//     ScrollMixin, ExpansionMixin, ExportMixin,
//     ContextMenuMixin, KeyboardMixin from ./mixins/
//   CellRenderers, Templates, Render from ./ui/
//   Performance from ./utils/performance.js
//   workerManager from ./core/worker-manager.js
//   FilterEngine, FilterRow, ColumnFilter,
//     QuickFilters, FilterPresets, GlobalFilter
//     from ./mixins/filters/
//   InlineEditor, Validators, EditHistory,
//     BatchEdit, RowOperations, DirtyState
//     from ./mixins/edit/
//   ExcelExport, PDFExport, ExportOptions,
//     PrintExport, Clipboard from ./mixins/export/
//   ResponsiveColumns, CardView, Touch,
//     BreakpointConfig from ./mixins/responsive/
//   I18n from ./i18n/index.js
//
// PROVIDES:
//   TableEngine class, create(), getInstance(),
//   setInstance(), getEmitMetrics(),
//   init(), render(), destroy(), setData(), getData(),
//   setColumns(), setFilters(), addFilter(),
//   removeFilter(), clearFilters(), setGlobalFilter(),
//   undo(), redo(), saveAll(), revertAll(), deleteRows(),
//   exportToCSV/Excel/PDF(), print(), copyToClipboard(),
//   setView(), info(), healthCheck(),
//   VERSION, MODULE_ID, TABLE_EVENTS, DEFAULTS,
//   injectPorts(), getPorts()
//
// RECEIVES (via constructor options):
//   container, options.columns, options.data,
//   options.editable, options.responsive,
//   options.touch, options.useWorker,
//   options.locale, options.cssPrefix,
//   options.events, options.view
//
// BROWSER APIs (legítimo — table UI):
//   document.querySelector — container resolution
//   document.addEventListener — resize/mouse events
// ═══════════════════════════════════════════════════════════════
// @changelog v2.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.5.0-ENTERPRISE: ES6 modernization (const/let, arrow functions, template literals, for...of, optional chaining)
// @changelog v2.4.1-ENTERPRISE - ES5 conversion for browser compatibility
// Componente Enterprise: Autocontido, Desacoplado, Reutilizável
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';
import { VERSION as CONST_VERSION, DEFAULT_CSS_PREFIX, DEFAULTS } from './constants.js';
import { TableState } from './state/store.js';
import { applyEventEmitter } from './core/events.js';
import * as formatters from './utils/formatters.js';
import * as telemetry from './telemetry/tracker.js';
import { SelectionMixin } from './mixins/selection.js';
import { SearchMixin } from './mixins/search.js';
import { ColumnsMixin } from './mixins/columns.js';
import { ScrollMixin } from './mixins/scroll.js';
import { ExpansionMixin } from './mixins/expansion.js';
import { ExportMixin } from './mixins/export.js';
import { ContextMenuMixin } from './mixins/context-menu.js';
import { KeyboardMixin } from './mixins/keyboard.js';
import * as CellRenderers from './ui/cell-renderers.js';
import * as Templates from './ui/templates.js';
import * as Render from './ui/render.js';
import * as Performance from './utils/performance.js';
import workerManager from './core/worker-manager.js';
import * as FilterEngine from './mixins/filters/engine.js';
import * as FilterRow from './mixins/filters/filter-row.js';
import * as ColumnFilter from './mixins/filters/column-filter.js';
import * as QuickFilters from './mixins/filters/quick-filters.js';
import * as FilterPresets from './mixins/filters/presets.js';
import * as GlobalFilter from './mixins/filters/global-filter.js';
import * as InlineEditor from './mixins/edit/inline-editor.js';
import * as Validators from './mixins/edit/validators.js';
import * as EditHistory from './mixins/edit/history.js';
import * as BatchEdit from './mixins/edit/batch-edit.js';
import * as RowOperations from './mixins/edit/row-operations.js';
import * as DirtyState from './mixins/edit/dirty-state.js';
import * as ExcelExport from './mixins/export/excel.js';
import * as PDFExport from './mixins/export/pdf.js';
import * as ExportOptions from './mixins/export/options-modal.js';
import * as PrintExport from './mixins/export/print.js';
import * as Clipboard from './mixins/export/clipboard.js';
import * as ResponsiveColumns from './mixins/responsive/columns.js';
import * as CardView from './mixins/responsive/card-view.js';
import * as Touch from './mixins/responsive/touch.js';
import * as BreakpointConfig from './mixins/responsive/breakpoint-config.js';
import * as I18n from './i18n/index.js';

export const VERSION = '2.6.0-P2-ENTERPRISE';
export const MODULE_ID = 'table-engine';
export { TABLE_EVENTS, DEFAULTS };

const hasWindow = typeof window !== 'undefined';

const _emitMetrics: { total: number; byEvent: Record<string, number>; lastEmitAt: number | null } = { total: 0, byEvent: {}, lastEmitAt: null };
const _trackEmit = (eventName: string) => { _emitMetrics.total++; _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1; _emitMetrics.lastEmitAt = Date.now(); };

const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger') as Record<string, ((...logArgs: unknown[]) => void)> | null; if (!logger?.[level]) return; logger[level](`[${MODULE_ID}]`, ...args); };

const applyMixins = (target: { prototype: Record<string, unknown> }, ...mixins: Record<string, unknown>[]) => { mixins.forEach((mixin: Record<string, unknown>) => { Object.getOwnPropertyNames(mixin).forEach((name: string) => { if (name !== 'constructor') Object.defineProperty(target.prototype, name, Object.getOwnPropertyDescriptor(mixin, name) || Object.create(null)); }); }); };

export class TableEngine {
  [key: string]: any;
  constructor(container: HTMLElement | string, options: Record<string, unknown> = {}) {
    this._container = typeof container === 'string' ? document.querySelector(container) : container;
    this._options = { ...DEFAULTS, ...options };
    this._cssPrefix = options.cssPrefix || DEFAULT_CSS_PREFIX;
    this._formatters = { ...formatters, ...((options.formatters || {}) as Record<string, unknown>) };
    this._state = new TableState(this._options);
    this._events = options.events || null;
    this._initialized = false;
    this._destroyed = false;
    this._handlers = {};
    this._view = options.view || 'table';
    this._filters = [];
    this._quickFilterIds = [];
    this._globalQuery = '';
    this._locale = options.locale || 'pt-BR';
    this._workerManager = null;
    this._inlineEditor = null;
    this._editHistory = null;
    this._dirtyState = null;
    this._touchHandler = null;
    this._responsiveManager = null;
    this._breakpointManager = null;
    this._filterPresets = null;
    applyEventEmitter(this);
    this._wrapEmit();
    telemetry.init({ events: this._events });
    I18n.setLocale(this._locale);
  }

  _wrapEmit() { const originalEmit = this.emit; if (originalEmit) { this.emit = (event: string, data: Record<string, unknown>) => { _trackEmit(event); return originalEmit.call(this, event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }; } }

  init() {
    if (this._initialized || this._destroyed) return this;
    try {
      _initPorts();
      if (this._options.columns) this._state.setColumns(this._options.columns);
      if (this._options.data) this._state.setData(this._options.data);
      this._initSubsystems();
      this._initSearch?.();
      this._initColumns?.();
      this._initScroll?.();
      this._initContextMenu?.();
      this._initKeyboard?.();
      this._bindEvents();
      this._initialized = true;
      this.emit(TABLE_EVENTS.DATA_LOADED, { version: VERSION });
      _log('info', 'Initialized v2.5.0 ENTERPRISE', { cssPrefix: this._cssPrefix });
      (telemetry as any).track('init');
    } catch (e: any) { _log('error', 'Init failed', e); this.emit(TABLE_EVENTS.EXPORT_ERROR, { error: e.message }); }
    return this;
  }

  _initSubsystems() {
    this._editHistory = EditHistory.createHistory({ maxSize: 50 });
    this._editHistory.subscribe((action: string, entry: Record<string, unknown> | null, state: Record<string, unknown>) => this.emit(TABLE_EVENTS.HISTORY_CHANGE, { action, entry, ...state }));
    this._dirtyState = DirtyState.createDirtyStateManager();
    this._dirtyState.subscribe((action: string, data: Record<string, unknown> | null, state: Record<string, unknown>) => this.emit(TABLE_EVENTS.DIRTY_CHANGE, { action, data, ...state }));
    if (this._options.editable !== false) { this._inlineEditor = InlineEditor.createInlineEditor({ cssPrefix: this._cssPrefix, validators: this._buildValidators(), onSave: (change) => this._onCellSave(change), onCancel: (change) => this._onCellCancel(change) }); }
    this._filterPresets = (FilterPresets as any).presetsManager;
    this._filterPresets.init(this._options.tableId || 'default');
    if (this._options.responsive !== false) { this._responsiveManager = ResponsiveColumns.createResponsiveColumnManager(); this._breakpointManager = BreakpointConfig.createBreakpointConfigManager().init(); this._breakpointManager.subscribe((info: Record<string, unknown>) => this._onBreakpointChange(info)); }
    if (this._options.touch !== false && 'ontouchstart' in window) { this._touchHandler = Touch.createTouchHandler({ cssPrefix: this._cssPrefix, swipeActions: this._options.swipeActions || Touch.DEFAULT_SWIPE_ACTIONS }); this._touchHandler.on('swipe', (data: Record<string, unknown>) => this._onSwipe(data)); }
    if (this._options.useWorker && typeof Worker !== 'undefined') { this._workerManager = workerManager; this._workerManager.init('/components/table-engine/core/worker.js').catch((e: unknown) => _log('warn', 'Worker init failed', e)); }
  }

  _buildValidators() { const validators: Record<string, unknown> = {}; const columns = this._state.getColumns(); columns.forEach((col: Record<string, unknown>) => { if (col.validator) (validators as Record<string, unknown>)[col.id as string] = col.validator; else if (col.validation) (validators as Record<string, unknown>)[col.id as string] = Validators.createValidatorForType(col.type as string, col.validation as Record<string, unknown>); }); return validators; }

  _bindEvents() {
    if (!this._container) return;
    this._handlers = { click: (e: Event) => this._onClick(e as MouseEvent), dblclick: (e: Event) => this._onDblClick(e), change: (e: Event) => this._onChange(e), input: (e: Event) => this._onInput(e), scroll: (e: Event) => this._onScroll(e), keydown: (e: Event) => this._onKeydown(e), mousedown: (e: Event) => this._onMouseDown(e as MouseEvent), mousemove: (e: Event) => this._onResizeMove(e as MouseEvent), mouseup: (e: Event) => this._onResizeEnd(), contextmenu: (e: Event) => this._onContextMenu(e), dragstart: (e: Event) => this._onDragStart(e as DragEvent), dragover: (e: Event) => this._onDragOver(e as DragEvent), drop: (e: Event) => this._onDrop(e as DragEvent), dragend: (e: Event) => this._onDragEnd() };
    for (const [evt, handler] of Object.entries(this._handlers)) { if (evt === 'mousemove' || evt === 'mouseup') document.addEventListener(evt, handler as any); else this._container.addEventListener(evt, handler as any, evt === 'scroll' ? true : undefined); }
    this._inlineEditor?.init?.(this._container);
    this._touchHandler?.init?.(this._container);
    this._responsiveManager?.init?.(this._container, this._state.getColumns());
  }

  _unbindEvents() { if (!this._container || !this._handlers.click) return; for (const [evt, handler] of Object.entries(this._handlers)) { if (evt === 'mousemove' || evt === 'mouseup') document.removeEventListener(evt, handler as any); else this._container.removeEventListener(evt, handler as any); } }

  // @ts-expect-error strict migration — TS2345
  _onClick(e: MouseEvent) { const p = this._cssPrefix; const t = e.target as HTMLElement; const actionEl = t.closest('[data-action]'); if (actionEl) { this._handleAction((actionEl as HTMLElement).dataset.action, e); return; } const row = t.closest(`tr[data-row-id], .${p}card[data-row-id]`); if (row && !t.closest('button, input, a, select')) { const id = (row as HTMLElement).dataset.rowId; if (e.shiftKey && this._state.getSelection().size > 0) { this._selectRange?.(Array.from(this._state.getSelection()).pop(), id); } else if (e.ctrlKey || e.metaKey) { this._toggleSelection?.(id); } else { this._selectRow?.(id); } } if (!t.closest(`.${p}context-menu`) && this._contextMenuOpen) this._closeContextMenu?.(); }

  _onDblClick(e: Event) { const t = e.target as HTMLElement; const cell = t.closest(`.${this._cssPrefix}td[data-col]`) as HTMLElement | null; if (cell && this._options.editable !== false) { const row = cell.closest('tr[data-row-id]') as HTMLElement | null; if (row && this._inlineEditor) this._inlineEditor.startEdit(cell, row.dataset.rowId, cell.dataset.col); } }

  _handleAction(action: string, e: Event) { const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null; const id = target?.dataset?.id || target?.dataset?.col; switch (action) { case 'close-shortcuts': this._closeKeyboardHelp?.(); break; case 'toggle-expand': this._toggleRowExpand?.(id); break; case 'set-view': this.setView(target?.dataset?.view); break; case 'toggle-card': this._toggleCardExpand(id); break; case 'add-row': this._addRow(); break; case 'undo': this.undo(); break; case 'redo': this.redo(); break; case 'save-all': this.saveAll(); break; case 'revert-all': this.revertAll(); break; case 'clear-global-search': this.clearGlobalFilter(); break; case 'clear-quick-filters': this.clearQuickFilters(); break; case 'open-export': this._openExportModal(); break; case 'close-export': case 'cancel-export': this._closeExportModal(); break; case 'confirm-export': this._doExport(); break; case 'print': this.print(); break; default: if (action?.startsWith('ctx-') && this._handleContextMenuAction) this._handleContextMenuAction(action); else if (action?.startsWith('quick-filter-')) this._toggleQuickFilter(action.replace('quick-filter-', '')); } }

  _onChange(e: Event) { const p = this._cssPrefix; const t = e.target as HTMLInputElement; if (t.classList.contains(`${p}checkbox-all`) && this._toggleSelectAll) this._toggleSelectAll(t.checked); if (t.classList.contains(`${p}checkbox-row`) && this._toggleSelection) this._toggleSelection(t.dataset.id); if (t.classList.contains(`${p}card-checkbox`) && this._toggleSelection) this._toggleSelection(t.dataset.id); }

  _onInput(e: Event) { const p = this._cssPrefix; const t = e.target as HTMLInputElement; if (t.classList.contains(`${p}search-input`) && this._handleSearchInput) this._handleSearchInput(t.value); if (t.classList.contains(`${p}global-filter-input`)) this._handleGlobalFilterInput(t.value); }

  _onMouseDown(e: MouseEvent) { const resizer = (e.target as HTMLElement).closest(`.${this._cssPrefix}th-resizer`) as HTMLElement | null; if (resizer && this._onResizeStart) this._onResizeStart(e, resizer); }

  _onCellSave(change: Record<string, unknown>) { this._dirtyState.trackOriginal(change.rowId, this._getRowById(change.rowId as string | number)); this._dirtyState.markDirty(change.rowId, change.column, change.newValue); this._editHistory.push({ type: 'edit', rowId: change.rowId, column: change.column, oldValue: change.oldValue, newValue: change.newValue }); this._updateRowData(change.rowId as string | number, { [change.column as string]: change.newValue }); this.emit(TABLE_EVENTS.CELL_SAVE, change); (telemetry as any).track('cell:edit'); }

  _onCellCancel(change: Record<string, unknown>) { this.emit(TABLE_EVENTS.CELL_CANCEL, change); }

  setFilters(filters: Record<string, unknown>[]) { this._filters = filters; this._applyFiltersAndRender(); this.emit(TABLE_EVENTS.FILTERS_CHANGE, { filters }); }
  addFilter(filter: Record<string, unknown>) { this._filters.push(filter); this._applyFiltersAndRender(); }
  removeFilter(column: string) { this._filters = this._filters.filter((f: Record<string, unknown>) => f.column !== column); this._applyFiltersAndRender(); }
  clearFilters() { this._filters = []; this._applyFiltersAndRender(); }
  setGlobalFilter(query: string) { this._globalQuery = query; this._applyFiltersAndRender(); }
  clearGlobalFilter() { this._globalQuery = ''; this._applyFiltersAndRender(); }

  _applyFiltersAndRender() { let data = this._state.getOriginalData(); if (this._globalQuery) data = (GlobalFilter as any).applyGlobalFilter(data, this._globalQuery, this._state.getColumns()); if (this._filters.length) data = (FilterEngine as any).applyFilters(data, this._filters); this._state.setFilteredData(data); this.render(); }

  _toggleQuickFilter(id: string) { const idx = this._quickFilterIds.indexOf(id); if (idx >= 0) this._quickFilterIds.splice(idx, 1); else this._quickFilterIds.push(id); this.emit(TABLE_EVENTS.QUICKFILTERS_CHANGE, { active: this._quickFilterIds }); this.render(); }

  clearQuickFilters() { this._quickFilterIds = []; this.emit(TABLE_EVENTS.QUICKFILTERS_CHANGE, { active: [] }); this.render(); }

  undo() { const entry = this._editHistory.undo(); if (entry) { this._updateRowData(entry.rowId, { [entry.column]: entry.oldValue }); this._dirtyState.markClean(entry.rowId, entry.column); this.render(); } }

  redo() { const entry = this._editHistory.redo(); if (entry) { this._updateRowData(entry.rowId, { [entry.column]: entry.newValue }); this._dirtyState.markDirty(entry.rowId, entry.column, entry.newValue); this.render(); } }

  saveAll() { const changes = this._dirtyState.getAllChanges(); this.emit(TABLE_EVENTS.SAVE_ALL, { changes }); this._dirtyState.commit(); this._editHistory.clear(); this.render(); }

  revertAll() { const reverted = this._dirtyState.revertAll(); reverted.forEach((item: Record<string, unknown>) => this._updateRowData(item.rowId as string | number, item.data)); this._editHistory.clear(); this.render(); }

  _addRow() { const newRow = RowOperations.createNewRow(this._state.getColumns(), { generateId: () => `new-${Date.now()}` }); this._state.addRow(newRow, 'start'); this._editHistory.push({ type: 'add', rowId: newRow.id, data: newRow }); this.render(); }

  deleteRows(ids: string | string[]) { const idsArray = Array.isArray(ids) ? ids : [ids]; idsArray.forEach((id) => { const row = this._getRowById(id); if (row) this._editHistory.push({ type: 'delete', rowId: id, data: row }); }); this._state.deleteRows(idsArray); this.render(); }

  exportToCSV(options = {}) { return (ExportMixin as any).exportToCSV ? (ExportMixin as any).exportToCSV(this.getFilteredData(), this._state.getColumns(), options) : null; }
  exportToExcel(options = {}) { return ExcelExport.exportToExcel(this.getFilteredData(), this._state.getColumns(), options); }
  exportToPDF(options = {}) { return PDFExport.exportToPDF(this.getFilteredData(), this._state.getColumns(), options); }
  print(options = {}) { return PrintExport.printTable(this.getFilteredData(), this._state.getColumns(), { title: this._options.title, ...options }); }
  copyToClipboard(options = {}) { return Clipboard.copyToClipboard(this.getSelectedData(), this._state.getColumns(), options); }

  setView(view: string | undefined) { if ((view === 'table' || view === 'card') && view !== this._view) { this._view = view; this.emit(TABLE_EVENTS.VIEW_CHANGE, { view }); this.render(); } }
  getView() { return this._view; }

  _onBreakpointChange(info: Record<string, unknown>) { if (this._options.autoSwitchView !== false) { const config = info.config as Record<string, unknown>; if (config.view && config.view !== this._view) this.setView(config.view as string); } this.emit(TABLE_EVENTS.BREAKPOINT_CHANGE, info); }

  _onSwipe(data: Record<string, unknown>) { this.emit(TABLE_EVENTS.SWIPE, data); if (data.action === 'delete') this.deleteRows([data.rowId as string]); else if (data.action === 'edit') this.emit(TABLE_EVENTS.ROW_EDIT, { rowId: data.rowId }); }

  setData(data: Record<string, unknown>[]) { this._state.setData(data); this._dirtyState.clear(); this._editHistory.clear(); this.emit(TABLE_EVENTS.DATA_UPDATED, { count: data?.length || 0 }); this.render(); return this; }
  getData() { return this._state.getData(); }
  getFilteredData() { return this._state.getFilteredData() || this._state.getData(); }
  getSelectedData() { return this._state.getSelectedRows(); }
  setColumns(columns: Record<string, unknown>[]) { this._state.setColumns(columns); this.render(); return this; }
  getColumns() { return this._state.getColumns(); }
  _getRowById(id: string | number) { const data = this._state.getData(); return data.find((r: Record<string, unknown>) => String(r.id) === String(id)); }
  _updateRowData(rowId: string | number, changes: unknown) { this._state.updateRow(rowId, changes); }

  render() {
    if (!this._container || this._destroyed) return this;
    const p = this._cssPrefix;
    const state = this._state.get();
    const data = this.getFilteredData();
    const columns = this._responsiveManager ? this._responsiveManager.getVisibleColumns() : state.columns;
    let html = '';
    html += this._renderToolbar();
    if (this._options.quickFilters) html += QuickFilters.renderQuickFilters(this._options.quickFilters, this._quickFilterIds, { cssPrefix: p });
    if (this._dirtyState.getDirtyCount() > 0) html += DirtyState.renderDirtyIndicator({ cssPrefix: p, dirtyCount: this._dirtyState.getDirtyCount() });
    if (this._view === 'card') html += CardView.renderCardView(data, columns, { cssPrefix: p, selection: this._state.getSelection(), expanded: this._state.getExpanded(), rowActions: this._options.rowActions });
    else html += (Render as any).renderTable(data, columns, { cssPrefix: p, state, formatters: this._formatters, cellRenderers: CellRenderers, selection: this._state.getSelection(), filters: this._filters, showFilterRow: this._options.showFilterRow, editable: this._options.editable, hoverActions: this._options.hoverActions });
    if (this._options.pagination !== false) html += Render.renderPagination(state.pagination, { cssPrefix: p, totalRecords: data.length });
    if (this._options.showViewToggle !== false) html += CardView.renderViewToggle(this._view, { cssPrefix: p });
    this._container.innerHTML = html;
    this.emit(TABLE_EVENTS.RENDER, { view: this._view, rowCount: data.length });
    return this;
  }

  _renderToolbar() { const p = this._cssPrefix; const selection = this._state.getSelection(); let toolbar = `<div class="${p}toolbar">`; toolbar += GlobalFilter.renderGlobalFilter(this._globalQuery, { cssPrefix: p }); toolbar += `<div class="${p}toolbar-actions">`; if (selection.size > 0) { toolbar += `<span class="${p}selection-count">${selection.size} ${(I18n as any).t('selection.selected')}</span>`; toolbar += `<button class="${p}btn" data-action="batch-edit">Editar</button>`; toolbar += `<button class="${p}btn ${p}btn-danger" data-action="batch-delete">Excluir</button>`; } toolbar += `<button class="${p}btn" data-action="open-export">${(I18n as any).t('export.title')}</button>`; toolbar += `<button class="${p}btn" data-action="print">${(I18n as any).t('print.title') || 'Imprimir'}</button>`; if (this._options.editable !== false) toolbar += `<button class="${p}btn ${p}btn-primary" data-action="add-row">${(I18n as any).t('action.add')}</button>`; toolbar += '</div></div>'; return toolbar; }

  getState() { return this._state.get(); }
  getCssPrefix() { return this._cssPrefix; }
  getFormatters() { return this._formatters; }

  destroy() { if (this._destroyed) return; this._unbindEvents(); this._inlineEditor?.destroy?.(); this._touchHandler?.destroy?.(); this._responsiveManager?.destroy?.(); this._breakpointManager?.destroy?.(); this._destroySearch?.(); this._destroyScroll?.(); this._closeContextMenu?.(); this._closeKeyboardHelp?.(); this._state.reset(); this._eventEmitter?.clear?.(); this._initialized = false; this._destroyed = true; this.emit(TABLE_EVENTS.EXPORT_ERROR, { reason: 'destroyed' }); _log('info', 'Destroyed'); }

  info() { return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, destroyed: this._destroyed, view: this._view, cssPrefix: this._cssPrefix, filtersCount: this._filters.length, dirtyCount: this._dirtyState?.getDirtyCount?.() || 0, historyUndo: this._editHistory?.undoCount || 0, historyRedo: this._editHistory?.redoCount || 0, portsInitialized: Ports.isInitialized(), state: this._state.info(), emitMetrics: { ..._emitMetrics }, telemetry: telemetry.info() }; }

  healthCheck() { const checks = { initialized: this._initialized, notDestroyed: !this._destroyed, hasContainer: !!this._container, stateHealthy: this._state.healthCheck().status === 'HEALTHY', portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 5 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, emitMetrics: { ..._emitMetrics }, p24Instrumented: true, timestamp: Date.now() }; }
}

applyMixins(TableEngine, SelectionMixin, SearchMixin, ColumnsMixin, ScrollMixin, ExpansionMixin, ExportMixin, ContextMenuMixin, KeyboardMixin);

export const create = (container: HTMLElement | string, options: Record<string, unknown> = {}) => new TableEngine(container, options).init();
let _instance: TableEngine | null = null;
export const getInstance = () => _instance;
export const setInstance = (instance: TableEngine | null) => { _instance = instance; };
export const getEmitMetrics = () => ({ ..._emitMetrics });

export { CellRenderers, Templates, Render, Performance, FilterEngine, Validators, I18n, Clipboard, workerManager };
export default { TableEngine, create, getInstance, setInstance, getEmitMetrics, VERSION, MODULE_ID, TABLE_EVENTS, DEFAULTS, CellRenderers, Templates, Render, Performance, FilterEngine, Validators, I18n, Clipboard, workerManager, injectPorts, getPorts };
