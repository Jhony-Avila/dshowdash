// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:columns
// PURPOSE: Table Engine - Columns Mixin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ColumnsMixin — exported value
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

export const VERSION = '1.1.0-P18EC';
export const MODULE_ID = 'table-engine:columns';

export const ColumnsMixin = {
  // @ts-expect-error strict migration — TS2339
  _initColumns() { this._resizing = null; this._dragging = null; },

  // RESIZE
  _onResizeStart(e: MouseEvent, resizer: HTMLElement) {
    e.preventDefault();
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    const th = resizer.closest('th');
    const table = th!.closest('table');
    // @ts-expect-error strict migration — TS2339
    this._resizing = { col: th!.dataset.col, startX: e.clientX, startWidth: th!.offsetWidth, th, table };
    table!.classList.add(`${p}resizing`);
    resizer.classList.add(`${p}resizing`);
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
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    this._resizing.table.classList.remove(`${p}resizing`);
    // @ts-expect-error strict migration — TS2339
    this._resizing.th.querySelector(`.${p}th-resizer`)?.classList.remove(`${p}resizing`);
    // @ts-expect-error strict migration — TS2339
    this._resizing = null;
  },

  // DRAG & DROP REORDER
  _onDragStart(e: DragEvent) {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    const grip = (e.target as HTMLElement).closest(`.${p}th-grip`);
    if (!grip) return;
    const th = grip.closest('th');
    if (!th || !th.dataset.col) return;
    // @ts-expect-error strict migration — TS2339
    const columns = this._state.get('columns') || [];
    const col = columns.find((c: Record<string, unknown>) => c.id === th.dataset.col);
    if (col?.reorderable === false) { e.preventDefault(); return; }
    // @ts-expect-error strict migration — TS2339
    this._dragging = { col: th.dataset.col, th };
    th.classList.add(`${p}dragging`);
    // @ts-expect-error strict migration — TS18047
    e.dataTransfer.effectAllowed = 'move';
    // @ts-expect-error strict migration — TS18047
    e.dataTransfer.setData('text/plain', th.dataset.col);
    const ghost = th.cloneNode(true) as HTMLElement;
    ghost.style.cssText = `position:absolute;top:-9999px;opacity:0.8;background:var(--${p}bg-surface);`;
    document.body.appendChild(ghost);
    // @ts-expect-error strict migration — TS18047
    e.dataTransfer.setDragImage(ghost, 50, 20);
    setTimeout(() => ghost.remove(), 0);
  },

  _onDragOver(e: DragEvent) {
    // @ts-expect-error strict migration — TS2339
    if (!this._dragging) return;
    e.preventDefault();
    // @ts-expect-error strict migration — TS18047
    e.dataTransfer.dropEffect = 'move';
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    const th = (e.target as HTMLElement).closest('th[data-col]');
    // @ts-expect-error strict migration — TS2339
    if (!th || th === this._dragging.th) return;
    // @ts-expect-error strict migration — TS2339
    const columns = this._state.get('columns') || [];
    const col = columns.find((c: Record<string, unknown>) => c.id === (th as HTMLElement).dataset.col);
    if (col?.reorderable === false) return;
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll(`th.${p}drag-over`).forEach((el: Element) => el.classList.remove(`${p}drag-over`));
    th.classList.add(`${p}drag-over`);
  },

  _onDrop(e: DragEvent) {
    // @ts-expect-error strict migration — TS2339
    if (!this._dragging) return;
    e.preventDefault();
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    const th = (e.target as HTMLElement).closest('th[data-col]');
    // @ts-expect-error strict migration — TS2339
    if (!th || th === this._dragging.th) return;
    // @ts-expect-error strict migration — TS2339
    const columns = this._state.get('columns') || [];
    const col = columns.find((c: Record<string, unknown>) => c.id === (th as HTMLElement).dataset.col);
    if (col?.reorderable === false) return;
    // @ts-expect-error strict migration — TS2339
    const fromId = this._dragging.col;
    const toId = (th as HTMLElement).dataset.col;
    // @ts-expect-error strict migration — TS2339
    const columnOrder = this._state.get('visibleColumns').map((c: Record<string, unknown>) => c.id);
    const fromIdx = columnOrder.indexOf(fromId);
    const toIdx = columnOrder.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    columnOrder.splice(fromIdx, 1);
    columnOrder.splice(toIdx, 0, fromId);
    this._reorderColumns(columnOrder);
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.COLUMN_REORDER, { order: columnOrder });
  },

  _onDragEnd() {
    // @ts-expect-error strict migration — TS2339
    if (!this._dragging) return;
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    this._dragging.th.classList.remove(`${p}dragging`);
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll(`th.${p}drag-over`).forEach((el: Element) => el.classList.remove(`${p}drag-over`));
    // @ts-expect-error strict migration — TS2339
    this._dragging = null;
  },

  _reorderColumns(order: string[]) {
    // @ts-expect-error strict migration — TS2339
    const columns = this._state.get('columns') || [];
    const reordered = order.map((id: string) => columns.find((c: Record<string, unknown>) => c.id === id)).filter(Boolean);
    // @ts-expect-error strict migration — TS2339
    this._state.setColumns(reordered);
    // @ts-expect-error strict migration — TS2339
    this.render?.();
  },

  // VISIBILITY
  _toggleColumnMenu() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const menu = this._container.querySelector(`.${p}column-toggle`);
    menu?.classList.toggle(`${p}open`);
  },

  _toggleColumn(colId: string) {
    // @ts-expect-error strict migration — TS2339
    const hidden = this._state.get('hiddenColumns');
    hidden.has(colId) ? hidden.delete(colId) : hidden.add(colId);
    this._applyHiddenColumns();
  },

  _applyHiddenColumns() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const hidden = this._state.get('hiddenColumns');
    // @ts-expect-error strict migration — TS2339
    const columns = this._state.get('columns') || [];
    columns.forEach((col: Record<string, unknown>) => {
      const isHidden = hidden.has(col.id);
      // @ts-expect-error strict migration — TS2339
      this._container.querySelectorAll(`[data-col="${col.id}"]`).forEach((el: Element) => {
        el.classList.toggle(`${p}col-hidden`, isHidden);
      });
    });
  },

  // PINNING
  _pinColumn(colId: string, side: string) {
    // @ts-expect-error strict migration — TS2339
    const pinned = this._state.get('pinnedColumns');
    if (side === 'left') { pinned.left.push(colId); pinned.right = pinned.right.filter((id: string) => id !== colId); }
    else if (side === 'right') { pinned.right.push(colId); pinned.left = pinned.left.filter((id: string) => id !== colId); }
    this._applyPinnedColumns();
  },

  _unpinColumn(colId: string) {
    // @ts-expect-error strict migration — TS2339
    const pinned = this._state.get('pinnedColumns');
    pinned.left = pinned.left.filter((id: string) => id !== colId);
    pinned.right = pinned.right.filter((id: string) => id !== colId);
    this._applyPinnedColumns();
  },

  _applyPinnedColumns() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const pinned = this._state.get('pinnedColumns');
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll('[data-col]').forEach((el: Element) => {
      el.classList.remove(`${p}pinned-left`, `${p}pinned-right`);
      if (pinned.left.includes((el as HTMLElement).dataset.col)) el.classList.add(`${p}pinned-left`);
      if (pinned.right.includes((el as HTMLElement).dataset.col)) el.classList.add(`${p}pinned-right`);
    });
  },

  _getOrderedColumns() {
    // @ts-expect-error strict migration — TS2339
    return this._state.get('visibleColumns') || [];
  }
};

export default ColumnsMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
