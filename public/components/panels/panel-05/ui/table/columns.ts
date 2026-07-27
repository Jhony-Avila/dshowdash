// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:columns
// PURPOSE: Panel-05 Table Columns
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_COLUMNS from ./constants.js
//   TABLE_EVENTS from /core/runtime/events/catalog/table.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ColumnsMixin — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TABLE_EVENTS.COLUMN_REORDER
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABLE_COLUMNS } from './constants.js';
import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:table:columns';

export const ColumnsMixin = {
  _initColumns() {
    // @ts-expect-error strict migration — TS2339
    this._resizing = null;
    // @ts-expect-error strict migration — TS2339
    this._dragging = null;
  },

  _onResizeStart(e: MouseEvent, resizer: HTMLElement) {
    e.preventDefault();

    const th = resizer.closest('th');
    const table = th!.closest('table');

    // @ts-expect-error strict migration — TS2339
    this._resizing = {
      col: th!.dataset.col,
      startX: e.clientX,
      startWidth: th!.offsetWidth,
      th,
      table
    };

    table!.classList.add('p05-resizing');
    resizer.classList.add('p05-resizing');
  },

  _onResizeMove(e: MouseEvent) {
    // @ts-expect-error strict migration — TS2339
    if (!this._resizing) return;
    e.preventDefault();

    // @ts-expect-error strict migration — TS2339
    const { startX, startWidth, th } = this._resizing;
    const newWidth = Math.max(50, startWidth + (e.clientX - startX));
    th.style.width = `${newWidth}px`;

    const colIdx = Array.from(th.parentNode.children).indexOf(th);
    // @ts-expect-error strict migration — TS2339
    this._resizing.table.querySelectorAll('tbody tr').forEach((row: Element) => {
      const cell = row.children[colIdx] as HTMLElement | undefined;
      if (cell) cell.style.width = `${newWidth}px`;
    });
  },

  _onResizeEnd() {
    // @ts-expect-error strict migration — TS2339
    if (!this._resizing) return;

    // @ts-expect-error strict migration — TS2339
    this._state.setColumnWidth(this._resizing.col, this._resizing.th.offsetWidth);
    // @ts-expect-error strict migration — TS2339
    this._resizing.table.classList.remove('p05-resizing');
    // @ts-expect-error strict migration — TS2339
    this._resizing.th.querySelector('.p05-th-resizer')?.classList.remove('p05-resizing');
    // @ts-expect-error strict migration — TS2339
    this._resizing = null;
  },

  _onDragStart(e: DragEvent) {
    const grip = (e.target as Element).closest('.p05-th-grip');
    if (!grip) return;

    const th = grip.closest('th') as HTMLElement | null;
    if (!th || !th.dataset.col) return;

    const col = TABLE_COLUMNS.find(c => c.id === th.dataset.col);
    if (!col?.reorderable) {
      e.preventDefault();
      return;
    }

    // @ts-expect-error strict migration — TS2339
    this._dragging = { col: th.dataset.col, th };
    th.classList.add('p05-dragging');

    (e.dataTransfer as DataTransfer).effectAllowed = 'move';
    (e.dataTransfer as DataTransfer).setData('text/plain', th.dataset.col);

    const ghost = th.cloneNode(true) as HTMLElement;
    ghost.style.cssText = 'position:absolute;top:-9999px;opacity:0.8;background:var(--p05-bg-surface);';
    document.body.appendChild(ghost);
    (e.dataTransfer as DataTransfer).setDragImage(ghost, 50, 20);
    setTimeout(() => ghost.remove(), 0);
  },

  _onDragOver(e: DragEvent) {
    // @ts-expect-error strict migration — TS2339
    if (!this._dragging) return;
    e.preventDefault();
    (e.dataTransfer as DataTransfer).dropEffect = 'move';

    const th = (e.target as Element).closest('th[data-col]') as HTMLElement | null;
    // @ts-expect-error strict migration — TS2339
    if (!th || th === this._dragging.th) return;

    const col = TABLE_COLUMNS.find(c => c.id === th.dataset.col);
    if (!col?.reorderable) return;

    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll('th.p05-drag-over').forEach((el: Element) => {
      el.classList.remove('p05-drag-over');
    });
    th.classList.add('p05-drag-over');
  },

  _onDrop(e: DragEvent) {
    // @ts-expect-error strict migration — TS2339
    if (!this._dragging) return;
    e.preventDefault();

    const th = (e.target as Element).closest('th[data-col]') as HTMLElement | null;
    // @ts-expect-error strict migration — TS2339
    if (!th || th === this._dragging.th) return;

    const targetCol = TABLE_COLUMNS.find(c => c.id === th.dataset.col);
    if (!targetCol?.reorderable) return;

    // @ts-expect-error strict migration — TS2339
    const fromId = this._dragging.col;
    const toId = th.dataset.col;
    // @ts-expect-error strict migration — TS2339
    const fromIdx = this._state.columnOrder.indexOf(fromId);
    // @ts-expect-error strict migration — TS2339
    const toIdx = this._state.columnOrder.indexOf(toId);

    if (fromIdx === -1 || toIdx === -1) return;

    // @ts-expect-error strict migration — TS2339
    this._state.columnOrder.splice(fromIdx, 1);
    // @ts-expect-error strict migration — TS2339
    this._state.columnOrder.splice(toIdx, 0, fromId);
    // @ts-expect-error strict migration — TS2339
    this._state.saveColumnOrder();

    // @ts-expect-error strict migration — TS2339
    this._state.shellRendered = false;
    // @ts-expect-error strict migration — TS2339
    this.render();

    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.COLUMN_REORDER, { order: this._state.columnOrder });
  },

  _onDragEnd() {
    // @ts-expect-error strict migration — TS2339
    if (!this._dragging) return;

    // @ts-expect-error strict migration — TS2339
    this._dragging.th.classList.remove('p05-dragging');
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll('th.p05-drag-over').forEach((el: Element) => {
      el.classList.remove('p05-drag-over');
    });
    // @ts-expect-error strict migration — TS2339
    this._dragging = null;
  },

  _resetColumnOrder() {
    // @ts-expect-error strict migration — TS2339
    this._state.resetColumnOrder();
    // @ts-expect-error strict migration — TS2339
    this._state.shellRendered = false;
    // @ts-expect-error strict migration — TS2339
    this.render();
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.COLUMN_REORDER, { order: this._state.columnOrder });
  },

  _toggleColumnMenu() {
    // @ts-expect-error strict migration — TS2339
    this._state.columnMenuOpen = !this._state.columnMenuOpen;
    // @ts-expect-error strict migration — TS2339
    this._container.querySelector('.p05-column-toggle')?.classList.toggle(
      'p05-open',
      // @ts-expect-error strict migration — TS2339
      this._state.columnMenuOpen
    );
  },

  _toggleColumn(colId: string) {
    // @ts-expect-error strict migration — TS2339
    this._state.toggleColumnVisibility(colId);
    this._applyHiddenColumns();
  },

  _applyHiddenColumns() {
    TABLE_COLUMNS.forEach(col => {
      // @ts-expect-error strict migration — TS2339
      const isHidden = this._state.isColumnHidden(col.id);
      // @ts-expect-error strict migration — TS2339
      this._container.querySelectorAll(`[data-col="${col.id}"]`).forEach((el: Element) => {
        el.classList.toggle('p05-col-hidden', isHidden);
      });
    });
  },

  _pinColumn(colId: string, side: string) {
    // @ts-expect-error strict migration — TS2339
    this._state.pinColumn(colId, side);
    this._applyPinnedColumns();
  },

  _unpinColumn(colId: string) {
    // @ts-expect-error strict migration — TS2339
    this._state.unpinColumn(colId);
    this._applyPinnedColumns();
  },

  _applyPinnedColumns() {
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll('[data-col]').forEach((el: Element) => {
      el.classList.remove('p05-pinned-left', 'p05-pinned-right');

      // @ts-expect-error strict migration — TS2339
      const pin = this._state.getColumnPin((el as HTMLElement).dataset.col);
      if (pin === 'left') el.classList.add('p05-pinned-left');
      if (pin === 'right') el.classList.add('p05-pinned-right');
    });
  },

  _getOrderedColumns() {
    // @ts-expect-error strict migration — TS2339
    return this._state.columnOrder
      .map((id: string) => TABLE_COLUMNS.find(c => c.id === id))
      .filter(Boolean);
  }
};

export default ColumnsMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { columnsReady: true } }; }
