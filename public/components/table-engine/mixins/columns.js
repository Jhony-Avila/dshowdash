import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "1.1.0-P18EC";
const MODULE_ID = "table-engine:columns";
const ColumnsMixin = {
  // @ts-expect-error strict migration — TS2339
  _initColumns() {
    this._resizing = null;
    this._dragging = null;
  },
  // RESIZE
  _onResizeStart(e, resizer) {
    e.preventDefault();
    const p = this._cssPrefix;
    const th = resizer.closest("th");
    const table = th.closest("table");
    this._resizing = { col: th.dataset.col, startX: e.clientX, startWidth: th.offsetWidth, th, table };
    table.classList.add(`${p}resizing`);
    resizer.classList.add(`${p}resizing`);
  },
  _onResizeMove(e) {
    if (!this._resizing) return;
    e.preventDefault();
    const { startX, startWidth, th } = this._resizing;
    const newWidth = Math.max(50, startWidth + (e.clientX - startX));
    th.style.width = `${newWidth}px`;
    const colIdx = Array.from(th.parentNode.children).indexOf(th);
    this._resizing.table.querySelectorAll("tbody tr").forEach((row) => {
      const cell = row.children[colIdx];
      if (cell) cell.style.width = `${newWidth}px`;
    });
  },
  _onResizeEnd() {
    if (!this._resizing) return;
    const p = this._cssPrefix;
    this._resizing.table.classList.remove(`${p}resizing`);
    this._resizing.th.querySelector(`.${p}th-resizer`)?.classList.remove(`${p}resizing`);
    this._resizing = null;
  },
  // DRAG & DROP REORDER
  _onDragStart(e) {
    const p = this._cssPrefix;
    const grip = e.target.closest(`.${p}th-grip`);
    if (!grip) return;
    const th = grip.closest("th");
    if (!th || !th.dataset.col) return;
    const columns = this._state.get("columns") || [];
    const col = columns.find((c) => c.id === th.dataset.col);
    if (col?.reorderable === false) {
      e.preventDefault();
      return;
    }
    this._dragging = { col: th.dataset.col, th };
    th.classList.add(`${p}dragging`);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", th.dataset.col);
    const ghost = th.cloneNode(true);
    ghost.style.cssText = `position:absolute;top:-9999px;opacity:0.8;background:var(--${p}bg-surface);`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 50, 20);
    setTimeout(() => ghost.remove(), 0);
  },
  _onDragOver(e) {
    if (!this._dragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const p = this._cssPrefix;
    const th = e.target.closest("th[data-col]");
    if (!th || th === this._dragging.th) return;
    const columns = this._state.get("columns") || [];
    const col = columns.find((c) => c.id === th.dataset.col);
    if (col?.reorderable === false) return;
    this._container.querySelectorAll(`th.${p}drag-over`).forEach((el) => el.classList.remove(`${p}drag-over`));
    th.classList.add(`${p}drag-over`);
  },
  _onDrop(e) {
    if (!this._dragging) return;
    e.preventDefault();
    const p = this._cssPrefix;
    const th = e.target.closest("th[data-col]");
    if (!th || th === this._dragging.th) return;
    const columns = this._state.get("columns") || [];
    const col = columns.find((c) => c.id === th.dataset.col);
    if (col?.reorderable === false) return;
    const fromId = this._dragging.col;
    const toId = th.dataset.col;
    const columnOrder = this._state.get("visibleColumns").map((c) => c.id);
    const fromIdx = columnOrder.indexOf(fromId);
    const toIdx = columnOrder.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    columnOrder.splice(fromIdx, 1);
    columnOrder.splice(toIdx, 0, fromId);
    this._reorderColumns(columnOrder);
    this.emit(TABLE_EVENTS.COLUMN_REORDER, { order: columnOrder });
  },
  _onDragEnd() {
    if (!this._dragging) return;
    const p = this._cssPrefix;
    this._dragging.th.classList.remove(`${p}dragging`);
    this._container.querySelectorAll(`th.${p}drag-over`).forEach((el) => el.classList.remove(`${p}drag-over`));
    this._dragging = null;
  },
  _reorderColumns(order) {
    const columns = this._state.get("columns") || [];
    const reordered = order.map((id) => columns.find((c) => c.id === id)).filter(Boolean);
    this._state.setColumns(reordered);
    this.render?.();
  },
  // VISIBILITY
  _toggleColumnMenu() {
    const p = this._cssPrefix;
    const menu = this._container.querySelector(`.${p}column-toggle`);
    menu?.classList.toggle(`${p}open`);
  },
  _toggleColumn(colId) {
    const hidden = this._state.get("hiddenColumns");
    hidden.has(colId) ? hidden.delete(colId) : hidden.add(colId);
    this._applyHiddenColumns();
  },
  _applyHiddenColumns() {
    const p = this._cssPrefix;
    const hidden = this._state.get("hiddenColumns");
    const columns = this._state.get("columns") || [];
    columns.forEach((col) => {
      const isHidden = hidden.has(col.id);
      this._container.querySelectorAll(`[data-col="${col.id}"]`).forEach((el) => {
        el.classList.toggle(`${p}col-hidden`, isHidden);
      });
    });
  },
  // PINNING
  _pinColumn(colId, side) {
    const pinned = this._state.get("pinnedColumns");
    if (side === "left") {
      pinned.left.push(colId);
      pinned.right = pinned.right.filter((id) => id !== colId);
    } else if (side === "right") {
      pinned.right.push(colId);
      pinned.left = pinned.left.filter((id) => id !== colId);
    }
    this._applyPinnedColumns();
  },
  _unpinColumn(colId) {
    const pinned = this._state.get("pinnedColumns");
    pinned.left = pinned.left.filter((id) => id !== colId);
    pinned.right = pinned.right.filter((id) => id !== colId);
    this._applyPinnedColumns();
  },
  _applyPinnedColumns() {
    const p = this._cssPrefix;
    const pinned = this._state.get("pinnedColumns");
    this._container.querySelectorAll("[data-col]").forEach((el) => {
      el.classList.remove(`${p}pinned-left`, `${p}pinned-right`);
      if (pinned.left.includes(el.dataset.col)) el.classList.add(`${p}pinned-left`);
      if (pinned.right.includes(el.dataset.col)) el.classList.add(`${p}pinned-right`);
    });
  },
  _getOrderedColumns() {
    return this._state.get("visibleColumns") || [];
  }
};
var columns_default = ColumnsMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  ColumnsMixin,
  MODULE_ID,
  VERSION,
  columns_default as default,
  healthCheck,
  info
};
