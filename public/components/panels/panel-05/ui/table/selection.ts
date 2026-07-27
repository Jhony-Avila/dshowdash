// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P24-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:selection
// PURPOSE: Panel-05 Table Selection
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_EVENTS from /core/runtime/events/catalog/table.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SelectionMixin — exported value
//   getEmitMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TABLE_EVENTS.ALL_DESELECTED
//   TABLE_EVENTS.ALL_SELECTED
//   TABLE_EVENTS.ROW_SELECTED
//   TABLE_EVENTS.SELECTION_CHANGED
//   checked ? TABLE_EVENTS.ALL_SELECTED : TABLE_EVENTS.ALL_DESELECTED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:table:selection';

// P24: Métricas de emissão
const _emitMetrics: { total: number; byEvent: Record<string, number>; lastEmitAt: number | null } = { total: 0, byEvent: {}, lastEmitAt: null };

function _trackEmit(eventName: string) {
  _emitMetrics.total++;
  _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1;
  _emitMetrics.lastEmitAt = Date.now();
}

export const SelectionMixin = {
  _selectRow(id: string) {
    // @ts-expect-error strict migration — TS2339
    this._container.querySelector('tr.p05-selected')?.classList.remove('p05-selected');
    // @ts-expect-error strict migration — TS2339
    this._state.selectRow(id);
    if (id) {
      // @ts-expect-error strict migration — TS2339
      const row = this._container.querySelector(`tr[data-cliente-id="${id}"]`);
      if (row) { row.classList.add('p05-selected'); row.focus(); }
    }
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('ROW_SELECTED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.ROW_SELECTED, { id, ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },

  _toggleSelection(id: string) {
    // @ts-expect-error strict migration — TS2339
    this._state.toggleSelection(id);
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('SELECTION_CHANGED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { id, ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },

  _selectRange(fromId: string, toId: string) {
    // @ts-expect-error strict migration — TS2339
    const rows = Array.from(this._container.querySelectorAll('tr[data-cliente-id]'));

    // @ts-expect-error TS migration - TS2339
    const fromIdx = rows.findIndex(r => r.dataset.clienteId === fromId);
    const toIdx = rows.findIndex(r => (r as any).dataset.clienteId === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const ids = [];
    for (let i = (Math as any).min(fromIdx, toIdx); i <= Math.max(fromIdx, toIdx); i++) {

      // @ts-expect-error TS migration - TS2339
      ids.push(rows[i].dataset.clienteId);
    }
    // @ts-expect-error strict migration — TS2339
    this._state.selectRange(ids);
    // @ts-expect-error strict migration — TS2339
    this._state.selectedRowId = toId;
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('SELECTION_CHANGED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { id: toId, ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },

  _selectAll() {
    // @ts-expect-error strict migration — TS2339
    this._state.selectAll();
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('ALL_SELECTED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.ALL_SELECTED, { ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },

  _selectAllPage() {
    // @ts-expect-error strict migration — TS2339
    const pageData = this._state.getPageData();
    const self = this;
    // @ts-expect-error strict migration — TS2339
    pageData.forEach((c: Record<string, unknown>) => { self._state.selectedIds.add(String(c.id)); });
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('SELECTION_CHANGED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },

  _toggleSelectAll(checked: boolean) {
    // @ts-expect-error strict migration — TS2339
    if (checked) { this._state.selectAll(); } else { this._state.clearSelection(); }
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    const eventName = checked ? 'ALL_SELECTED' : 'ALL_DESELECTED';
    _trackEmit(eventName);
    // @ts-expect-error strict migration — TS2339
    this.emit(checked ? TABLE_EVENTS.ALL_SELECTED : TABLE_EVENTS.ALL_DESELECTED, { ids: this._state.getSelectedIds(), source: MODULE_ID, timestamp: Date.now() });
  },

  _clearSelection() {
    // @ts-expect-error strict migration — TS2339
    this._state.clearSelection();
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('ALL_DESELECTED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.ALL_DESELECTED, { ids: [], source: MODULE_ID, timestamp: Date.now() });
  },

  _navigateRows(direction: number, extendSelection?: boolean) {
    extendSelection = extendSelection || false;
    // @ts-expect-error strict migration — TS2339
    const rows = Array.from(this._container.querySelectorAll('tr[data-cliente-id]'));
    if (!rows.length) return;

    // @ts-expect-error TS migration - TS2339
    let currentIdx = (this._state as any).selectedRowId ? rows.findIndex(r => r.dataset.clienteId === this._state.selectedRowId) : -1;
    if (currentIdx === -1) { currentIdx = direction > 0 ? -1 : rows.length; }
    const nextIdx = Math.max(0, Math.min(rows.length - 1, currentIdx + direction));

    // @ts-expect-error TS migration - TS2339
    const nextId = rows[nextIdx].dataset.clienteId;
    if (extendSelection) { this._toggleSelection(nextId); } else { this._selectRow(nextId); }

    // @ts-expect-error TS migration - TS2339
    rows[nextIdx].scrollIntoView({ block: 'nearest' });
  },

  _updateRowSelection() {
    const self = this;
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll('tr[data-cliente-id]').forEach((row: Element) => {
      // @ts-expect-error strict migration — TS2339
      const isSelected = self._state.isSelected((row as HTMLElement).dataset.clienteId);
      row.classList.toggle('p05-selected', isSelected);
      row.setAttribute('aria-selected', isSelected);
    });
  },

  _updateCheckboxes() {
    // @ts-expect-error strict migration — TS2339
    const allCheckbox = this._container.querySelector('.p05-checkbox-all');
    if (allCheckbox) {
      // @ts-expect-error strict migration — TS2339
      const displayData = this._state.getDisplayData();
      const total = displayData.length;
      // @ts-expect-error strict migration — TS2339
      const selected = this._state.selectedIds.size;
      allCheckbox.checked = selected === total && total > 0;
      allCheckbox.indeterminate = selected > 0 && selected < total;
    }
    const self = this;
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll('.p05-checkbox-row').forEach((cb: Element) => {
      // @ts-expect-error strict migration — TS2339
      (cb as HTMLInputElement).checked = self._state.isSelected((cb as HTMLInputElement).dataset.id);
    });
  },

  _updateBulkBar() {
    // @ts-expect-error strict migration — TS2339
    const bar = this._container.querySelector('.p05-bulk-bar');
    if (bar) {
      // @ts-expect-error strict migration — TS2339
      const count = this._state.selectedIds.size;
      bar.classList.toggle('p05-visible', count > 0);
      const countEl = bar.querySelector('.p05-bulk-count');
      if (countEl) { countEl.textContent = `${count} selecionado${count > 1 ? 's' : ''}`; }
    }
  }
};

export function getEmitMetrics() { return Object.assign({}, _emitMetrics); }
export default SelectionMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION, emitMetrics: getEmitMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { selectionReady: true }, emitMetrics: getEmitMetrics(), p24Instrumented: true, timestamp: Date.now() }; }
