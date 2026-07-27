import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "1.2.0-P24";
const MODULE_ID = "table-engine:selection";
const _emitMetrics = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName) {
  _emitMetrics.total++;
  _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1;
  _emitMetrics.lastEmitAt = Date.now();
}
const SelectionMixin = {
  _selectRow(id) {
    const p = this._cssPrefix;
    const selected = this._container.querySelector(`tr.${p}selected`);
    if (selected) selected.classList.remove(`${p}selected`);
    this._state.select(id);
    if (id) {
      const row = this._container.querySelector(`tr[data-row-id="${id}"]`);
      if (row) {
        row.classList.add(`${p}selected`);
        row.focus();
      }
    }
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("SELECTION_CHANGED");
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { id, ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },
  _toggleSelection(id) {
    this._state.toggleSelection(id);
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("SELECTION_CHANGED");
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { id, ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },
  _selectRange(fromId, toId) {
    const rows = Array.from(this._container.querySelectorAll("tr[data-row-id]"));
    const fromIdx = rows.findIndex((r) => r.dataset.rowId === fromId);
    const toIdx = rows.findIndex((r) => r.dataset.rowId === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    for (let i = Math.min(fromIdx, toIdx); i <= Math.max(fromIdx, toIdx); i++) {
      this._state.select(rows[i].dataset.rowId);
    }
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("SELECTION_CHANGED");
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },
  _selectAll() {
    this._state.selectAll();
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("SELECTION_CHANGED");
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },
  _toggleSelectAll(checked) {
    if (checked) {
      this._state.selectAll();
    } else {
      this._state.clearSelection();
    }
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("SELECTION_CHANGED");
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },
  _clearSelection() {
    this._state.clearSelection();
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("SELECTION_CHANGED");
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: [], source: MODULE_ID, timestamp: Date.now() });
  },
  _navigateRows(direction, extendSelection = false) {
    const rows = Array.from(this._container.querySelectorAll("tr[data-row-id]"));
    if (!rows.length) return;
    const selection = this._state.getSelection();
    const currentId = selection.size > 0 ? Array.from(selection)[selection.size - 1] : null;
    let currentIdx = currentId ? rows.findIndex((r) => r.dataset.rowId === currentId) : -1;
    if (currentIdx === -1) currentIdx = direction > 0 ? -1 : rows.length;
    const nextIdx = Math.max(0, Math.min(rows.length - 1, currentIdx + direction));
    const nextId = rows[nextIdx].dataset.rowId;
    if (extendSelection) {
      this._toggleSelection(nextId);
    } else {
      this._selectRow(nextId);
    }
    rows[nextIdx].scrollIntoView({ block: "nearest" });
  },
  _updateRowSelection() {
    const p = this._cssPrefix;
    const selection = this._state.getSelection();
    this._container.querySelectorAll("tr[data-row-id]").forEach((row) => {
      const isSelected = selection.has(row.dataset.rowId);
      row.classList.toggle(`${p}selected`, isSelected);
      row.setAttribute("aria-selected", String(isSelected));
    });
  },
  _updateCheckboxes() {
    const p = this._cssPrefix;
    const allCheckbox = this._container.querySelector(`.${p}checkbox-all`);
    if (allCheckbox) {
      const total = this._state.getFilteredData().length;
      const selected = this._state.getSelection().size;
      allCheckbox.checked = selected === total && total > 0;
      allCheckbox.indeterminate = selected > 0 && selected < total;
    }
    const selection = this._state.getSelection();
    this._container.querySelectorAll(`.${p}checkbox-row`).forEach((cb) => {
      cb.checked = selection.has(cb.dataset.id);
    });
  },
  _updateBulkBar() {
    const p = this._cssPrefix;
    const bar = this._container.querySelector(`.${p}bulk-bar`);
    if (bar) {
      const count = this._state.getSelection().size;
      bar.classList.toggle(`${p}visible`, count > 0);
      const countEl = bar.querySelector(`.${p}bulk-count`);
      if (countEl) countEl.textContent = `${count} selecionado${count > 1 ? "s" : ""}`;
    }
  }
};
function getEmitMetrics() {
  return Object.assign({}, _emitMetrics);
}
var selection_default = SelectionMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION, emitMetrics: getEmitMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, emitMetrics: getEmitMetrics(), p24Instrumented: true, timestamp: Date.now() };
}
export {
  MODULE_ID,
  SelectionMixin,
  VERSION,
  selection_default as default,
  getEmitMetrics,
  healthCheck,
  info
};
