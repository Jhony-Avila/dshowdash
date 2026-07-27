import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
import { DEFAULT_CSS_PREFIX, DEFAULTS } from "./constants.js";
import { TableState } from "./state/store.js";
import { applyEventEmitter } from "./core/events.js";
import * as formatters from "./utils/formatters.js";
import * as telemetry from "./telemetry/tracker.js";
import { SelectionMixin } from "./mixins/selection.js";
import { SearchMixin } from "./mixins/search.js";
import { ColumnsMixin } from "./mixins/columns.js";
import { ScrollMixin } from "./mixins/scroll.js";
import { ExpansionMixin } from "./mixins/expansion.js";
import { ExportMixin } from "./mixins/export.js";
import { ContextMenuMixin } from "./mixins/context-menu.js";
import { KeyboardMixin } from "./mixins/keyboard.js";
import * as CellRenderers from "./ui/cell-renderers.js";
import * as Templates from "./ui/templates.js";
import * as Render from "./ui/render.js";
import * as Performance from "./utils/performance.js";
import workerManager from "./core/worker-manager.js";
import * as FilterEngine from "./mixins/filters/engine.js";
import * as QuickFilters from "./mixins/filters/quick-filters.js";
import * as FilterPresets from "./mixins/filters/presets.js";
import * as GlobalFilter from "./mixins/filters/global-filter.js";
import * as InlineEditor from "./mixins/edit/inline-editor.js";
import * as Validators from "./mixins/edit/validators.js";
import * as EditHistory from "./mixins/edit/history.js";
import * as RowOperations from "./mixins/edit/row-operations.js";
import * as DirtyState from "./mixins/edit/dirty-state.js";
import * as ExcelExport from "./mixins/export/excel.js";
import * as PDFExport from "./mixins/export/pdf.js";
import * as PrintExport from "./mixins/export/print.js";
import * as Clipboard from "./mixins/export/clipboard.js";
import * as ResponsiveColumns from "./mixins/responsive/columns.js";
import * as CardView from "./mixins/responsive/card-view.js";
import * as Touch from "./mixins/responsive/touch.js";
import * as BreakpointConfig from "./mixins/responsive/breakpoint-config.js";
import * as I18n from "./i18n/index.js";
const VERSION = "2.6.0-P2-ENTERPRISE";
const MODULE_ID = "table-engine";
const hasWindow = typeof window !== "undefined";
const _emitMetrics = { total: 0, byEvent: {}, lastEmitAt: null };
const _trackEmit = (eventName) => {
  _emitMetrics.total++;
  _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1;
  _emitMetrics.lastEmitAt = Date.now();
};
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger?.[level]) return;
  logger[level](`[${MODULE_ID}]`, ...args);
};
const applyMixins = (target, ...mixins) => {
  mixins.forEach((mixin) => {
    Object.getOwnPropertyNames(mixin).forEach((name) => {
      if (name !== "constructor") Object.defineProperty(target.prototype, name, Object.getOwnPropertyDescriptor(mixin, name) || /* @__PURE__ */ Object.create(null));
    });
  });
};
class TableEngine {
  constructor(container, options = {}) {
    this._container = typeof container === "string" ? document.querySelector(container) : container;
    this._options = { ...DEFAULTS, ...options };
    this._cssPrefix = options.cssPrefix || DEFAULT_CSS_PREFIX;
    this._formatters = { ...formatters, ...options.formatters || {} };
    this._state = new TableState(this._options);
    this._events = options.events || null;
    this._initialized = false;
    this._destroyed = false;
    this._handlers = {};
    this._view = options.view || "table";
    this._filters = [];
    this._quickFilterIds = [];
    this._globalQuery = "";
    this._locale = options.locale || "pt-BR";
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
  _wrapEmit() {
    const originalEmit = this.emit;
    if (originalEmit) {
      this.emit = (event, data) => {
        _trackEmit(event);
        return originalEmit.call(this, event, { ...data, source: MODULE_ID, timestamp: Date.now() });
      };
    }
  }
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
      _log("info", "Initialized v2.5.0 ENTERPRISE", { cssPrefix: this._cssPrefix });
      telemetry.track("init");
    } catch (e) {
      _log("error", "Init failed", e);
      this.emit(TABLE_EVENTS.EXPORT_ERROR, { error: e.message });
    }
    return this;
  }
  _initSubsystems() {
    this._editHistory = EditHistory.createHistory({ maxSize: 50 });
    this._editHistory.subscribe((action, entry, state) => this.emit(TABLE_EVENTS.HISTORY_CHANGE, { action, entry, ...state }));
    this._dirtyState = DirtyState.createDirtyStateManager();
    this._dirtyState.subscribe((action, data, state) => this.emit(TABLE_EVENTS.DIRTY_CHANGE, { action, data, ...state }));
    if (this._options.editable !== false) {
      this._inlineEditor = InlineEditor.createInlineEditor({ cssPrefix: this._cssPrefix, validators: this._buildValidators(), onSave: (change) => this._onCellSave(change), onCancel: (change) => this._onCellCancel(change) });
    }
    this._filterPresets = FilterPresets.presetsManager;
    this._filterPresets.init(this._options.tableId || "default");
    if (this._options.responsive !== false) {
      this._responsiveManager = ResponsiveColumns.createResponsiveColumnManager();
      this._breakpointManager = BreakpointConfig.createBreakpointConfigManager().init();
      this._breakpointManager.subscribe((info) => this._onBreakpointChange(info));
    }
    if (this._options.touch !== false && "ontouchstart" in window) {
      this._touchHandler = Touch.createTouchHandler({ cssPrefix: this._cssPrefix, swipeActions: this._options.swipeActions || Touch.DEFAULT_SWIPE_ACTIONS });
      this._touchHandler.on("swipe", (data) => this._onSwipe(data));
    }
    if (this._options.useWorker && typeof Worker !== "undefined") {
      this._workerManager = workerManager;
      this._workerManager.init("/components/table-engine/core/worker.js").catch((e) => _log("warn", "Worker init failed", e));
    }
  }
  _buildValidators() {
    const validators = {};
    const columns = this._state.getColumns();
    columns.forEach((col) => {
      if (col.validator) validators[col.id] = col.validator;
      else if (col.validation) validators[col.id] = Validators.createValidatorForType(col.type, col.validation);
    });
    return validators;
  }
  _bindEvents() {
    if (!this._container) return;
    this._handlers = { click: (e) => this._onClick(e), dblclick: (e) => this._onDblClick(e), change: (e) => this._onChange(e), input: (e) => this._onInput(e), scroll: (e) => this._onScroll(e), keydown: (e) => this._onKeydown(e), mousedown: (e) => this._onMouseDown(e), mousemove: (e) => this._onResizeMove(e), mouseup: (e) => this._onResizeEnd(), contextmenu: (e) => this._onContextMenu(e), dragstart: (e) => this._onDragStart(e), dragover: (e) => this._onDragOver(e), drop: (e) => this._onDrop(e), dragend: (e) => this._onDragEnd() };
    for (const [evt, handler] of Object.entries(this._handlers)) {
      if (evt === "mousemove" || evt === "mouseup") document.addEventListener(evt, handler);
      else this._container.addEventListener(evt, handler, evt === "scroll" ? true : void 0);
    }
    this._inlineEditor?.init?.(this._container);
    this._touchHandler?.init?.(this._container);
    this._responsiveManager?.init?.(this._container, this._state.getColumns());
  }
  _unbindEvents() {
    if (!this._container || !this._handlers.click) return;
    for (const [evt, handler] of Object.entries(this._handlers)) {
      if (evt === "mousemove" || evt === "mouseup") document.removeEventListener(evt, handler);
      else this._container.removeEventListener(evt, handler);
    }
  }
  // @ts-expect-error strict migration — TS2345
  _onClick(e) {
    const p = this._cssPrefix;
    const t = e.target;
    const actionEl = t.closest("[data-action]");
    if (actionEl) {
      this._handleAction(actionEl.dataset.action, e);
      return;
    }
    const row = t.closest(`tr[data-row-id], .${p}card[data-row-id]`);
    if (row && !t.closest("button, input, a, select")) {
      const id = row.dataset.rowId;
      if (e.shiftKey && this._state.getSelection().size > 0) {
        this._selectRange?.(Array.from(this._state.getSelection()).pop(), id);
      } else if (e.ctrlKey || e.metaKey) {
        this._toggleSelection?.(id);
      } else {
        this._selectRow?.(id);
      }
    }
    if (!t.closest(`.${p}context-menu`) && this._contextMenuOpen) this._closeContextMenu?.();
  }
  _onDblClick(e) {
    const t = e.target;
    const cell = t.closest(`.${this._cssPrefix}td[data-col]`);
    if (cell && this._options.editable !== false) {
      const row = cell.closest("tr[data-row-id]");
      if (row && this._inlineEditor) this._inlineEditor.startEdit(cell, row.dataset.rowId, cell.dataset.col);
    }
  }
  _handleAction(action, e) {
    const target = e.target.closest("[data-action]");
    const id = target?.dataset?.id || target?.dataset?.col;
    switch (action) {
      case "close-shortcuts":
        this._closeKeyboardHelp?.();
        break;
      case "toggle-expand":
        this._toggleRowExpand?.(id);
        break;
      case "set-view":
        this.setView(target?.dataset?.view);
        break;
      case "toggle-card":
        this._toggleCardExpand(id);
        break;
      case "add-row":
        this._addRow();
        break;
      case "undo":
        this.undo();
        break;
      case "redo":
        this.redo();
        break;
      case "save-all":
        this.saveAll();
        break;
      case "revert-all":
        this.revertAll();
        break;
      case "clear-global-search":
        this.clearGlobalFilter();
        break;
      case "clear-quick-filters":
        this.clearQuickFilters();
        break;
      case "open-export":
        this._openExportModal();
        break;
      case "close-export":
      case "cancel-export":
        this._closeExportModal();
        break;
      case "confirm-export":
        this._doExport();
        break;
      case "print":
        this.print();
        break;
      default:
        if (action?.startsWith("ctx-") && this._handleContextMenuAction) this._handleContextMenuAction(action);
        else if (action?.startsWith("quick-filter-")) this._toggleQuickFilter(action.replace("quick-filter-", ""));
    }
  }
  _onChange(e) {
    const p = this._cssPrefix;
    const t = e.target;
    if (t.classList.contains(`${p}checkbox-all`) && this._toggleSelectAll) this._toggleSelectAll(t.checked);
    if (t.classList.contains(`${p}checkbox-row`) && this._toggleSelection) this._toggleSelection(t.dataset.id);
    if (t.classList.contains(`${p}card-checkbox`) && this._toggleSelection) this._toggleSelection(t.dataset.id);
  }
  _onInput(e) {
    const p = this._cssPrefix;
    const t = e.target;
    if (t.classList.contains(`${p}search-input`) && this._handleSearchInput) this._handleSearchInput(t.value);
    if (t.classList.contains(`${p}global-filter-input`)) this._handleGlobalFilterInput(t.value);
  }
  _onMouseDown(e) {
    const resizer = e.target.closest(`.${this._cssPrefix}th-resizer`);
    if (resizer && this._onResizeStart) this._onResizeStart(e, resizer);
  }
  _onCellSave(change) {
    this._dirtyState.trackOriginal(change.rowId, this._getRowById(change.rowId));
    this._dirtyState.markDirty(change.rowId, change.column, change.newValue);
    this._editHistory.push({ type: "edit", rowId: change.rowId, column: change.column, oldValue: change.oldValue, newValue: change.newValue });
    this._updateRowData(change.rowId, { [change.column]: change.newValue });
    this.emit(TABLE_EVENTS.CELL_SAVE, change);
    telemetry.track("cell:edit");
  }
  _onCellCancel(change) {
    this.emit(TABLE_EVENTS.CELL_CANCEL, change);
  }
  setFilters(filters) {
    this._filters = filters;
    this._applyFiltersAndRender();
    this.emit(TABLE_EVENTS.FILTERS_CHANGE, { filters });
  }
  addFilter(filter) {
    this._filters.push(filter);
    this._applyFiltersAndRender();
  }
  removeFilter(column) {
    this._filters = this._filters.filter((f) => f.column !== column);
    this._applyFiltersAndRender();
  }
  clearFilters() {
    this._filters = [];
    this._applyFiltersAndRender();
  }
  setGlobalFilter(query) {
    this._globalQuery = query;
    this._applyFiltersAndRender();
  }
  clearGlobalFilter() {
    this._globalQuery = "";
    this._applyFiltersAndRender();
  }
  _applyFiltersAndRender() {
    let data = this._state.getOriginalData();
    if (this._globalQuery) data = GlobalFilter.applyGlobalFilter(data, this._globalQuery, this._state.getColumns());
    if (this._filters.length) data = FilterEngine.applyFilters(data, this._filters);
    this._state.setFilteredData(data);
    this.render();
  }
  _toggleQuickFilter(id) {
    const idx = this._quickFilterIds.indexOf(id);
    if (idx >= 0) this._quickFilterIds.splice(idx, 1);
    else this._quickFilterIds.push(id);
    this.emit(TABLE_EVENTS.QUICKFILTERS_CHANGE, { active: this._quickFilterIds });
    this.render();
  }
  clearQuickFilters() {
    this._quickFilterIds = [];
    this.emit(TABLE_EVENTS.QUICKFILTERS_CHANGE, { active: [] });
    this.render();
  }
  undo() {
    const entry = this._editHistory.undo();
    if (entry) {
      this._updateRowData(entry.rowId, { [entry.column]: entry.oldValue });
      this._dirtyState.markClean(entry.rowId, entry.column);
      this.render();
    }
  }
  redo() {
    const entry = this._editHistory.redo();
    if (entry) {
      this._updateRowData(entry.rowId, { [entry.column]: entry.newValue });
      this._dirtyState.markDirty(entry.rowId, entry.column, entry.newValue);
      this.render();
    }
  }
  saveAll() {
    const changes = this._dirtyState.getAllChanges();
    this.emit(TABLE_EVENTS.SAVE_ALL, { changes });
    this._dirtyState.commit();
    this._editHistory.clear();
    this.render();
  }
  revertAll() {
    const reverted = this._dirtyState.revertAll();
    reverted.forEach((item) => this._updateRowData(item.rowId, item.data));
    this._editHistory.clear();
    this.render();
  }
  _addRow() {
    const newRow = RowOperations.createNewRow(this._state.getColumns(), { generateId: () => `new-${Date.now()}` });
    this._state.addRow(newRow, "start");
    this._editHistory.push({ type: "add", rowId: newRow.id, data: newRow });
    this.render();
  }
  deleteRows(ids) {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    idsArray.forEach((id) => {
      const row = this._getRowById(id);
      if (row) this._editHistory.push({ type: "delete", rowId: id, data: row });
    });
    this._state.deleteRows(idsArray);
    this.render();
  }
  exportToCSV(options = {}) {
    return ExportMixin.exportToCSV ? ExportMixin.exportToCSV(this.getFilteredData(), this._state.getColumns(), options) : null;
  }
  exportToExcel(options = {}) {
    return ExcelExport.exportToExcel(this.getFilteredData(), this._state.getColumns(), options);
  }
  exportToPDF(options = {}) {
    return PDFExport.exportToPDF(this.getFilteredData(), this._state.getColumns(), options);
  }
  print(options = {}) {
    return PrintExport.printTable(this.getFilteredData(), this._state.getColumns(), { title: this._options.title, ...options });
  }
  copyToClipboard(options = {}) {
    return Clipboard.copyToClipboard(this.getSelectedData(), this._state.getColumns(), options);
  }
  setView(view) {
    if ((view === "table" || view === "card") && view !== this._view) {
      this._view = view;
      this.emit(TABLE_EVENTS.VIEW_CHANGE, { view });
      this.render();
    }
  }
  getView() {
    return this._view;
  }
  _onBreakpointChange(info) {
    if (this._options.autoSwitchView !== false) {
      const config = info.config;
      if (config.view && config.view !== this._view) this.setView(config.view);
    }
    this.emit(TABLE_EVENTS.BREAKPOINT_CHANGE, info);
  }
  _onSwipe(data) {
    this.emit(TABLE_EVENTS.SWIPE, data);
    if (data.action === "delete") this.deleteRows([data.rowId]);
    else if (data.action === "edit") this.emit(TABLE_EVENTS.ROW_EDIT, { rowId: data.rowId });
  }
  setData(data) {
    this._state.setData(data);
    this._dirtyState.clear();
    this._editHistory.clear();
    this.emit(TABLE_EVENTS.DATA_UPDATED, { count: data?.length || 0 });
    this.render();
    return this;
  }
  getData() {
    return this._state.getData();
  }
  getFilteredData() {
    return this._state.getFilteredData() || this._state.getData();
  }
  getSelectedData() {
    return this._state.getSelectedRows();
  }
  setColumns(columns) {
    this._state.setColumns(columns);
    this.render();
    return this;
  }
  getColumns() {
    return this._state.getColumns();
  }
  _getRowById(id) {
    const data = this._state.getData();
    return data.find((r) => String(r.id) === String(id));
  }
  _updateRowData(rowId, changes) {
    this._state.updateRow(rowId, changes);
  }
  render() {
    if (!this._container || this._destroyed) return this;
    const p = this._cssPrefix;
    const state = this._state.get();
    const data = this.getFilteredData();
    const columns = this._responsiveManager ? this._responsiveManager.getVisibleColumns() : state.columns;
    let html = "";
    html += this._renderToolbar();
    if (this._options.quickFilters) html += QuickFilters.renderQuickFilters(this._options.quickFilters, this._quickFilterIds, { cssPrefix: p });
    if (this._dirtyState.getDirtyCount() > 0) html += DirtyState.renderDirtyIndicator({ cssPrefix: p, dirtyCount: this._dirtyState.getDirtyCount() });
    if (this._view === "card") html += CardView.renderCardView(data, columns, { cssPrefix: p, selection: this._state.getSelection(), expanded: this._state.getExpanded(), rowActions: this._options.rowActions });
    else html += Render.renderTable(data, columns, { cssPrefix: p, state, formatters: this._formatters, cellRenderers: CellRenderers, selection: this._state.getSelection(), filters: this._filters, showFilterRow: this._options.showFilterRow, editable: this._options.editable, hoverActions: this._options.hoverActions });
    if (this._options.pagination !== false) html += Render.renderPagination(state.pagination, { cssPrefix: p, totalRecords: data.length });
    if (this._options.showViewToggle !== false) html += CardView.renderViewToggle(this._view, { cssPrefix: p });
    this._container.innerHTML = html;
    this.emit(TABLE_EVENTS.RENDER, { view: this._view, rowCount: data.length });
    return this;
  }
  _renderToolbar() {
    const p = this._cssPrefix;
    const selection = this._state.getSelection();
    let toolbar = `<div class="${p}toolbar">`;
    toolbar += GlobalFilter.renderGlobalFilter(this._globalQuery, { cssPrefix: p });
    toolbar += `<div class="${p}toolbar-actions">`;
    if (selection.size > 0) {
      toolbar += `<span class="${p}selection-count">${selection.size} ${I18n.t("selection.selected")}</span>`;
      toolbar += `<button class="${p}btn" data-action="batch-edit">Editar</button>`;
      toolbar += `<button class="${p}btn ${p}btn-danger" data-action="batch-delete">Excluir</button>`;
    }
    toolbar += `<button class="${p}btn" data-action="open-export">${I18n.t("export.title")}</button>`;
    toolbar += `<button class="${p}btn" data-action="print">${I18n.t("print.title") || "Imprimir"}</button>`;
    if (this._options.editable !== false) toolbar += `<button class="${p}btn ${p}btn-primary" data-action="add-row">${I18n.t("action.add")}</button>`;
    toolbar += "</div></div>";
    return toolbar;
  }
  getState() {
    return this._state.get();
  }
  getCssPrefix() {
    return this._cssPrefix;
  }
  getFormatters() {
    return this._formatters;
  }
  destroy() {
    if (this._destroyed) return;
    this._unbindEvents();
    this._inlineEditor?.destroy?.();
    this._touchHandler?.destroy?.();
    this._responsiveManager?.destroy?.();
    this._breakpointManager?.destroy?.();
    this._destroySearch?.();
    this._destroyScroll?.();
    this._closeContextMenu?.();
    this._closeKeyboardHelp?.();
    this._state.reset();
    this._eventEmitter?.clear?.();
    this._initialized = false;
    this._destroyed = true;
    this.emit(TABLE_EVENTS.EXPORT_ERROR, { reason: "destroyed" });
    _log("info", "Destroyed");
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, destroyed: this._destroyed, view: this._view, cssPrefix: this._cssPrefix, filtersCount: this._filters.length, dirtyCount: this._dirtyState?.getDirtyCount?.() || 0, historyUndo: this._editHistory?.undoCount || 0, historyRedo: this._editHistory?.redoCount || 0, portsInitialized: Ports.isInitialized(), state: this._state.info(), emitMetrics: { ..._emitMetrics }, telemetry: telemetry.info() };
  }
  healthCheck() {
    const checks = { initialized: this._initialized, notDestroyed: !this._destroyed, hasContainer: !!this._container, stateHealthy: this._state.healthCheck().status === "HEALTHY", portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, emitMetrics: { ..._emitMetrics }, p24Instrumented: true, timestamp: Date.now() };
  }
}
applyMixins(TableEngine, SelectionMixin, SearchMixin, ColumnsMixin, ScrollMixin, ExpansionMixin, ExportMixin, ContextMenuMixin, KeyboardMixin);
const create = (container, options = {}) => new TableEngine(container, options).init();
let _instance = null;
const getInstance = () => _instance;
const setInstance = (instance) => {
  _instance = instance;
};
const getEmitMetrics = () => ({ ..._emitMetrics });
var table_engine_default = { TableEngine, create, getInstance, setInstance, getEmitMetrics, VERSION, MODULE_ID, TABLE_EVENTS, DEFAULTS, CellRenderers, Templates, Render, Performance, FilterEngine, Validators, I18n, Clipboard, workerManager, injectPorts, getPorts };
export {
  CellRenderers,
  Clipboard,
  DEFAULTS,
  FilterEngine,
  I18n,
  MODULE_ID,
  Performance,
  Render,
  TABLE_EVENTS,
  TableEngine,
  Templates,
  VERSION,
  Validators,
  create,
  table_engine_default as default,
  getEmitMetrics,
  getInstance,
  getPorts,
  injectPorts,
  setInstance,
  workerManager
};
