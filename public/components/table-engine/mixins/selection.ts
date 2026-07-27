// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P24)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:selection
// PURPOSE: Table Engine - Selection Mixin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SelectionMixin — exported value
//   getEmitMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '1.2.0-P24';
export const MODULE_ID = 'table-engine:selection';

// P24: Métricas de emissão
const _emitMetrics: { total: number; byEvent: Record<string, number>; lastEmitAt: number | null } = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName: string) { _emitMetrics.total++; _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1; _emitMetrics.lastEmitAt = Date.now(); }

export const SelectionMixin = {
  _selectRow(id: string) {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const selected = this._container.querySelector(`tr.${p}selected`);
    if (selected) selected.classList.remove(`${p}selected`);
    // @ts-expect-error strict migration — TS2339
    this._state.select(id);
    if (id) {
      // @ts-expect-error strict migration — TS2339
      const row = this._container.querySelector(`tr[data-row-id="${id}"]`);
      if (row) { row.classList.add(`${p}selected`); row.focus(); }
    }
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('SELECTION_CHANGED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { id, ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },

  _toggleSelection(id: string) {
    // @ts-expect-error strict migration — TS2339
    this._state.toggleSelection(id);
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('SELECTION_CHANGED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { id, ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },

  _selectRange(fromId: string, toId: string) {
    // @ts-expect-error strict migration — TS2339
    const rows: HTMLTableRowElement[] = Array.from(this._container.querySelectorAll('tr[data-row-id]'));
    const fromIdx = rows.findIndex((r: HTMLTableRowElement) => r.dataset.rowId === fromId);
    const toIdx = rows.findIndex((r: HTMLTableRowElement) => r.dataset.rowId === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    for (let i = Math.min(fromIdx, toIdx); i <= Math.max(fromIdx, toIdx); i++) {
      // @ts-expect-error strict migration — TS2339
      this._state.select(rows[i].dataset.rowId);
    }
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('SELECTION_CHANGED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },

  _selectAll() {
    // @ts-expect-error strict migration — TS2339
    this._state.selectAll();
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('SELECTION_CHANGED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },

  _toggleSelectAll(checked: boolean) {
    // @ts-expect-error strict migration — TS2339
    if (checked) { this._state.selectAll(); } else { this._state.clearSelection(); }
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('SELECTION_CHANGED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: Array.from(this._state.getSelection()), source: MODULE_ID, timestamp: Date.now() });
  },

  _clearSelection() {
    // @ts-expect-error strict migration — TS2339
    this._state.clearSelection();
    this._updateRowSelection();
    this._updateBulkBar();
    this._updateCheckboxes();
    _trackEmit('SELECTION_CHANGED');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SELECTION_CHANGED, { ids: [], source: MODULE_ID, timestamp: Date.now() });
  },

  _navigateRows(direction: number, extendSelection = false) {
    // @ts-expect-error strict migration — TS2339
    const rows: HTMLTableRowElement[] = Array.from(this._container.querySelectorAll('tr[data-row-id]'));
    if (!rows.length) return;
    // @ts-expect-error strict migration — TS2339
    const selection = this._state.getSelection();
    const currentId = selection.size > 0 ? Array.from(selection)[selection.size - 1] : null;
    let currentIdx = currentId ? rows.findIndex((r: HTMLTableRowElement) => r.dataset.rowId === currentId) : -1;
    if (currentIdx === -1) currentIdx = direction > 0 ? -1 : rows.length;
    const nextIdx = Math.max(0, Math.min(rows.length - 1, currentIdx + direction));
    const nextId = rows[nextIdx].dataset.rowId;
    // @ts-expect-error strict migration — TS2345
    if (extendSelection) { this._toggleSelection(nextId); } else { this._selectRow(nextId); }
    rows[nextIdx].scrollIntoView({ block: 'nearest' });
  },

  _updateRowSelection() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const selection = this._state.getSelection();
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll('tr[data-row-id]').forEach((row: Element) => {
      const isSelected = selection.has((row as HTMLElement).dataset.rowId);
      row.classList.toggle(`${p}selected`, isSelected);
      row.setAttribute('aria-selected', String(isSelected));
    });
  },

  _updateCheckboxes() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const allCheckbox = this._container.querySelector(`.${p}checkbox-all`);
    if (allCheckbox) {
      // @ts-expect-error strict migration — TS2339
      const total = this._state.getFilteredData().length;
      // @ts-expect-error strict migration — TS2339
      const selected = this._state.getSelection().size;
      allCheckbox.checked = selected === total && total > 0;
      allCheckbox.indeterminate = selected > 0 && selected < total;
    }
    // @ts-expect-error strict migration — TS2339
    const selection = this._state.getSelection();
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll(`.${p}checkbox-row`).forEach((cb: Element) => {
      (cb as HTMLInputElement).checked = selection.has((cb as HTMLElement).dataset.id);
    });
  },

  _updateBulkBar() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const bar = this._container.querySelector(`.${p}bulk-bar`);
    if (bar) {
      // @ts-expect-error strict migration — TS2339
      const count = this._state.getSelection().size;
      bar.classList.toggle(`${p}visible`, count > 0);
      const countEl = bar.querySelector(`.${p}bulk-count`);
      if (countEl) countEl.textContent = `${count} selecionado${count > 1 ? 's' : ''}`;
    }
  }
};

export function getEmitMetrics() { return Object.assign({}, _emitMetrics); }
export default SelectionMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION, emitMetrics: getEmitMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, emitMetrics: getEmitMetrics(), p24Instrumented: true, timestamp: Date.now() }; }
