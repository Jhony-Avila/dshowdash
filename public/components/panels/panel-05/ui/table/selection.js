import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:table:selection";
const _emitMetrics = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName) {
  _emitMetrics.total++;
  _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1;
  _emitMetrics.lastEmitAt = Date.now();
}
const SelectionMixin = {
  _selectRow(id) {
    this._container.querySelector("tr.p05-selected")?.classList.remove("p05-selected");
    this._state.selectRow(id);
    if (id) {
      const row = this._container.querySelector(`tr[data-cliente-id="${id}"]`);
      if (row) {
        row.classList.add("p05-selected");
        row.focus();
      }
    }
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("ROW_SELECTED");
    this.emit(TABLE_EVENTS.ROW_SELECTED, { id, ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },
  _toggleSelection(id) {
    this._state.toggleSelection(id);
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("SELECTION_CHANGED");
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { id, ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },
  _selectRange(fromId, toId) {
    const rows = Array.from(this._container.querySelectorAll("tr[data-cliente-id]"));
    const fromIdx = rows.findIndex((r) => r.dataset.clienteId === fromId);
    const toIdx = rows.findIndex((r) => r.dataset.clienteId === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const ids = [];
    for (let i = Math.min(fromIdx, toIdx); i <= Math.max(fromIdx, toIdx); i++) {
      ids.push(rows[i].dataset.clienteId);
    }
    this._state.selectRange(ids);
    this._state.selectedRowId = toId;
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("SELECTION_CHANGED");
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { id: toId, ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },
  _selectAll() {
    this._state.selectAll();
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("ALL_SELECTED");
    this.emit(TABLE_EVENTS.ALL_SELECTED, { ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },
  _selectAllPage() {
    const pageData = this._state.getPageData();
    const self = this;
    pageData.forEach((c) => {
      self._state.selectedIds.add(String(c.id));
    });
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("SELECTION_CHANGED");
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
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
    const eventName = checked ? "ALL_SELECTED" : "ALL_DESELECTED";
    _trackEmit(eventName);
    this.emit(checked ? TABLE_EVENTS.ALL_SELECTED : TABLE_EVENTS.ALL_DESELECTED, { ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },
  _clearSelection() {
    this._state.clearSelection();
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit("ALL_DESELECTED");
    this.emit(TABLE_EVENTS.ALL_DESELECTED, { ids: [], source: MODULE_ID, timestamp: Date.now() });
  },
  _navigateRows(direction, extendSelection) {
    extendSelection = extendSelection || false;
    const rows = Array.from(this._container.querySelectorAll("tr[data-cliente-id]"));
    if (!rows.length) return;
    let currentIdx = this._state.selectedRowId ? rows.findIndex((r) => r.dataset.clienteId === this._state.selectedRowId) : -1;
    if (currentIdx === -1) {
      currentIdx = direction > 0 ? -1 : rows.length;
    }
    const nextIdx = Math.max(0, Math.min(rows.length - 1, currentIdx + direction));
    const nextId = rows[nextIdx].dataset.clienteId;
    if (extendSelection) {
      this._toggleSelection(nextId);
    } else {
      this._selectRow(nextId);
    }
    rows[nextIdx].scrollIntoView({ block: "nearest" });
  },
  _updateRowSelection() {
    const self = this;
    this._container.querySelectorAll("tr[data-cliente-id]").forEach((row) => {
      const isSelected = self._state.isSelected(row.dataset.clienteId);
      row.classList.toggle("p05-selected", isSelected);
      row.setAttribute("aria-selected", isSelected);
    });
  },
  _updateCheckboxes() {
    const allCheckbox = this._container.querySelector(".p05-checkbox-all");
    if (allCheckbox) {
      const displayData = this._state.getDisplayData();
      const total = displayData.length;
      const selected = this._state.selectedIds.size;
      allCheckbox.checked = selected === total && total > 0;
      allCheckbox.indeterminate = selected > 0 && selected < total;
    }
    const self = this;
    this._container.querySelectorAll(".p05-checkbox-row").forEach((cb) => {
      cb.checked = self._state.isSelected(cb.dataset.id);
    });
  },
  _updateBulkBar() {
    const bar = this._container.querySelector(".p05-bulk-bar");
    if (bar) {
      const count = this._state.selectedIds.size;
      bar.classList.toggle("p05-visible", count > 0);
      const countEl = bar.querySelector(".p05-bulk-count");
      if (countEl) {
        countEl.textContent = `${count} selecionado${count > 1 ? "s" : ""}`;
      }
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
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { selectionReady: true }, emitMetrics: getEmitMetrics(), p24Instrumented: true, timestamp: Date.now() };
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
