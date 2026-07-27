import { VERSION as MODULE_ID, SHORTCUTS, TABLE_COLUMNS } from "./constants.js";
import { copyToClipboard } from "./utils.js";
import { TableState } from "./state.js";
import { applyEventEmitter } from "./events.js";
import { SelectionMixin } from "./selection.js";
import { SearchMixin } from "./search.js";
import { ColumnsMixin } from "./columns.js";
import { ScrollMixin } from "./scroll.js";
import { ExpansionMixin } from "./expansion.js";
import { ExportMixin } from "./export.js";
import { ContextMenuMixin } from "./context-menu.js";
import { KeyboardHelpMixin } from "./keyboard-help.js";
import { RenderMixin } from "./render.js";
import { TABLE_INTENTS } from "/core/runtime/events/catalog/table.events.js";
import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const _emitMetrics = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName) {
  _emitMetrics.total++;
  _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1;
  _emitMetrics.lastEmitAt = Date.now();
}
function TableComponent(container, options) {
  options = options || {};
  this._container = typeof container === "string" ? document.querySelector(container) : container;
  this._options = options;
  this._state = new TableState(options);
  this._abortController = null;
  applyEventEmitter(this);
  this._initSearch();
  this._initColumns();
  this._initScroll();
  this._bindEvents();
}
let _originalEmit = null;
TableComponent.prototype._wrapEmit = function() {
  const self = this;
  if (!_originalEmit && this.emit) {
    _originalEmit = this.emit.bind(this);
    this.emit = (event, data) => {
      _trackEmit(event);
      return _originalEmit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
    };
  }
};
TableComponent.prototype._bindEvents = function() {
  const self = this;
  this._wrapEmit();
  this._abortController = new AbortController();
  const signal = this._abortController.signal;
  this._handlers = {
    click(e) {
      self._onClick(e);
    },
    change(e) {
      self._onChange(e);
    },
    input(e) {
      self._onInput(e);
    },
    scroll(e) {
      self._onScroll(e);
    },
    keydown(e) {
      self._onKeydown(e);
    },
    mousedown(e) {
      self._onMouseDown(e);
    },
    mousemove(e) {
      self._onResizeMove(e);
    },
    mouseup(e) {
      self._onResizeEnd(e);
    },
    contextmenu(e) {
      self._onContextMenu(e);
    },
    dragstart(e) {
      self._onDragStart(e);
    },
    dragover(e) {
      self._onDragOver(e);
    },
    drop(e) {
      self._onDrop(e);
    },
    dragend(e) {
      self._onDragEnd(e);
    }
  };
  this._container.addEventListener("click", this._handlers.click);
  this._container.addEventListener("change", this._handlers.change);
  this._container.addEventListener("input", this._handlers.input);
  this._container.addEventListener("scroll", this._handlers.scroll, true);
  this._container.addEventListener("keydown", this._handlers.keydown);
  this._container.addEventListener("mousedown", this._handlers.mousedown);
  this._container.addEventListener("contextmenu", this._handlers.contextmenu);
  this._container.addEventListener("dragstart", this._handlers.dragstart);
  this._container.addEventListener("dragover", this._handlers.dragover);
  this._container.addEventListener("drop", this._handlers.drop);
  this._container.addEventListener("dragend", this._handlers.dragend);
  document.addEventListener("mousemove", this._handlers.mousemove, { signal });
  document.addEventListener("mouseup", this._handlers.mouseup, { signal });
};
TableComponent.prototype._onClick = function(e) {
  const et = e.target;
  if (this._state.contextMenuOpen && !et.closest(".p05-context-menu")) {
    this._closeContextMenu();
  }
  if (this._state.keyboardHelpOpen && !et.closest(".p05-keyboard-help")) {
    this._closeKeyboardHelp();
  }
  if (this._state.columnMenuOpen && !et.closest(".p05-column-toggle")) {
    this._state.columnMenuOpen = false;
    const toggle = this._container.querySelector(".p05-column-toggle");
    if (toggle) toggle.classList.remove("p05-open");
  }
  const row = et.closest("tr[data-cliente-id]");
  if (row && !et.closest("[data-action]") && !et.closest("button") && !et.closest("input")) {
    if (e.shiftKey && this._state.selectedRowId) {
      this._selectRange(this._state.selectedRowId, row.dataset.clienteId);
    } else if (e.ctrlKey || e.metaKey) {
      this._toggleSelection(row.dataset.clienteId);
    } else {
      this._selectRow(row.dataset.clienteId);
    }
    return;
  }
  const target = et.closest("[data-action]");
  if (!target) return;
  this._handleAction(target.dataset.action, target, e);
};
TableComponent.prototype._handleAction = function(action, target, e) {
  switch (action) {
    case "sort":
      this._handleSort(target.dataset.sort, e.shiftKey);
      break;
    case "page":
      this._setPage(parseInt(target.dataset.page, 10));
      break;
    case "view-cliente":
      this.emit(TABLE_INTENTS.VIEW_ROW, { id: target.dataset.id });
      break;
    case "edit-cliente":
      this.emit(TABLE_INTENTS.EDIT_ROW, { id: target.dataset.id });
      break;
    case "delete-cliente":
      this.emit(TABLE_INTENTS.DELETE_ROW, { id: target.dataset.id });
      break;
    case "toggle-favorito":
      this.emit(TABLE_INTENTS.TOGGLE_FAVORITE, { id: target.dataset.id });
      break;
    case "toggle-expand":
      this._toggleRowExpand(target.dataset.id);
      break;
    case "toggle-columns":
      this._toggleColumnMenu();
      break;
    case "set-density":
      this._setDensity(target.dataset.density);
      break;
    case "set-scroll-mode":
      this._setScrollMode(target.dataset.mode);
      break;
    case "clear-selection":
      this._clearSelection();
      break;
    case "pin-left":
      this._pinColumn(target.dataset.col, "left");
      break;
    case "pin-right":
      this._pinColumn(target.dataset.col, "right");
      break;
    case "unpin":
      this._unpinColumn(target.dataset.col);
      break;
    case "copy-cnpj":
      this._copyToClipboard(target.dataset.cnpj);
      break;
    case "reset-order":
      this._resetColumnOrder();
      break;
    case "clear-search":
      this._clearSearch();
      break;
    case "export-all":
      this._exportCSV(false);
      break;
    case "export-selected":
      this._exportCSV(true);
      break;
    case "bulk-delete":
      this._handleBulkDelete();
      break;
    case "bulk-export":
      this._exportCSV(true);
      break;
    case "select-all-page":
      this._selectAllPage();
      break;
    case "show-shortcuts":
      this._showKeyboardHelp();
      break;
    case "close-shortcuts":
      this._closeKeyboardHelp();
      break;
    case "ctx-view":
    case "ctx-edit":
    case "ctx-expand":
    case "ctx-fav":
    case "ctx-copy":
    case "ctx-delete":
      this._handleContextMenuAction(action);
      break;
  }
};
TableComponent.prototype._onChange = function(e) {
  const target = e.target;
  if (target.dataset.columnToggle) {
    this._toggleColumn(target.dataset.columnToggle);
  }
  if (target.classList.contains("p05-checkbox-row")) {
    this._toggleSelection(target.dataset.id);
  }
  if (target.classList.contains("p05-checkbox-all")) {
    this._toggleSelectAll(target.checked);
  }
};
TableComponent.prototype._onInput = function(e) {
  const target = e.target;
  if (target.classList.contains("p05-search-input")) {
    this._handleSearchInput(target.value);
  }
};
TableComponent.prototype._onMouseDown = function(e) {
  const resizer = e.target.closest(".p05-th-resizer");
  if (resizer) {
    this._onResizeStart(e, resizer);
  }
};
TableComponent.prototype._onKeydown = function(e) {
  const et = e.target;
  if (et.matches("input, textarea, select")) {
    if (e.key === "Escape") {
      this._clearSearch();
      et.blur();
    }
    return;
  }
  if (e.ctrlKey && e.key === "f" || e.key === "/") {
    e.preventDefault();
    const input = this._container.querySelector(".p05-search-input");
    if (input) input.focus();
    return;
  }
  const shortcut = SHORTCUTS[e.key];
  if (shortcut) {
    e.preventDefault();
    this._executeShortcut(shortcut.action);
    return;
  }
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    this._navigateRows(e.key === "ArrowDown" ? 1 : -1, e.shiftKey);
  }
  if (e.key === "Enter" && this._state.selectedRowId) {
    e.preventDefault();
    this.emit(TABLE_INTENTS.VIEW_ROW, { id: this._state.selectedRowId });
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "a") {
    e.preventDefault();
    this._selectAll();
  }
};
TableComponent.prototype._executeShortcut = function(action) {
  switch (action) {
    case "next-row":
      this._navigateRows(1);
      break;
    case "prev-row":
      this._navigateRows(-1);
      break;
    case "expand-row":
      if (this._state.selectedRowId) this._toggleRowExpand(this._state.selectedRowId);
      break;
    case "view-row":
      if (this._state.selectedRowId) this.emit(TABLE_INTENTS.VIEW_ROW, { id: this._state.selectedRowId });
      break;
    case "toggle-fav":
      if (this._state.selectedRowId) this.emit(TABLE_INTENTS.TOGGLE_FAVORITE, { id: this._state.selectedRowId });
      break;
    case "delete-row":
      if (this._state.selectedRowId) this.emit(TABLE_INTENTS.DELETE_ROW, { id: this._state.selectedRowId });
      break;
    case "toggle-select":
      if (this._state.selectedRowId) this._toggleSelection(this._state.selectedRowId);
      break;
    case "clear":
      this._clearSelection();
      break;
    case "show-help":
      this._showKeyboardHelp();
      break;
  }
};
TableComponent.prototype._handleSort = function(field, addToExisting) {
  addToExisting = addToExisting || false;
  const sortColumns = this._state.handleSort(field, addToExisting);
  this.emit(TABLE_INTENTS.SORT, { columns: sortColumns, field: sortColumns[0] ? sortColumns[0].field : null, dir: sortColumns[0] ? sortColumns[0].dir : null });
};
TableComponent.prototype._handleBulkDelete = function() {
  const ids = this._state.getSelectedIds();
  if (!ids.length) return;
  this.emit(TABLE_INTENTS.BULK_DELETE, { ids });
};
TableComponent.prototype._copyToClipboard = function(text) {
  const self = this;
  copyToClipboard(text, () => {
    self.emit(UI_INTENTS.SHOW_TOAST, { type: "success", message: "CNPJ copiado!" });
  });
};
TableComponent.prototype.setData = function(data) {
  this._state.setData(data);
  if (this._state.searchQuery) {
    this._applySearch();
  }
};
TableComponent.prototype.getSelectedIds = function() {
  return this._state.getSelectedIds();
};
TableComponent.prototype.clearSelection = function() {
  this._clearSelection();
};
TableComponent.prototype.isFavorito = function(id) {
  return this._state.isFavorito(id);
};
TableComponent.prototype.setFavoritos = function(favs) {
  this._state.setFavoritos(favs);
};
TableComponent.prototype.info = function() {
  const stateInfo = this._state.getInfo();
  return Object.assign({ moduleId: MODULE_ID, version: VERSION, emitMetrics: Object.assign({}, _emitMetrics) }, stateInfo);
};
TableComponent.prototype.healthCheck = function() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now(), shellRendered: this._state.shellRendered, refsValid: !!(this._state.refs && this._state.refs.tbody), emitMetrics: Object.assign({}, _emitMetrics), p24Instrumented: true };
};
TableComponent.prototype.destroy = function() {
  this._destroyScroll();
  this._destroySearch();
  this._closeContextMenu();
  this._closeKeyboardHelp();
  if (this._container) {
    const self = this;
    ["click", "change", "input", "keydown", "mousedown", "contextmenu", "dragstart", "dragover", "drop", "dragend"].forEach((evt) => {
      self._container.removeEventListener(evt, self._handlers[evt]);
    });
    this._container.removeEventListener("scroll", this._handlers.scroll, true);
  }
  if (this._abortController) {
    this._abortController.abort();
    this._abortController = null;
  }
  this.clearEvents();
  this._state.refs = {};
  this._container = null;
};
Object.assign(TableComponent.prototype, SelectionMixin);
Object.assign(TableComponent.prototype, SearchMixin);
Object.assign(TableComponent.prototype, ColumnsMixin);
Object.assign(TableComponent.prototype, ScrollMixin);
Object.assign(TableComponent.prototype, ExpansionMixin);
Object.assign(TableComponent.prototype, ExportMixin);
Object.assign(TableComponent.prototype, ContextMenuMixin);
Object.assign(TableComponent.prototype, KeyboardHelpMixin);
Object.assign(TableComponent.prototype, RenderMixin);
function getEmitMetrics() {
  return Object.assign({}, _emitMetrics);
}
var table_default = TableComponent;
export {
  MODULE_ID,
  TABLE_COLUMNS,
  TableComponent,
  VERSION,
  table_default as default,
  getEmitMetrics
};
