import { TABLE_COLUMNS } from "./constants.js";
import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:table:columns";
const ColumnsMixin = {
  _initColumns() {
    this._resizing = null;
    this._dragging = null;
  },
  _onResizeStart(e, resizer) {
    e.preventDefault();
    const th = resizer.closest("th");
    const table = th.closest("table");
    this._resizing = {
      col: th.dataset.col,
      startX: e.clientX,
      startWidth: th.offsetWidth,
      th,
      table
    };
    table.classList.add("p05-resizing");
    resizer.classList.add("p05-resizing");
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
    this._state.setColumnWidth(this._resizing.col, this._resizing.th.offsetWidth);
    this._resizing.table.classList.remove("p05-resizing");
    this._resizing.th.querySelector(".p05-th-resizer")?.classList.remove("p05-resizing");
    this._resizing = null;
  },
  _onDragStart(e) {
    const grip = e.target.closest(".p05-th-grip");
    if (!grip) return;
    const th = grip.closest("th");
    if (!th || !th.dataset.col) return;
    const col = TABLE_COLUMNS.find((c) => c.id === th.dataset.col);
    if (!col?.reorderable) {
      e.preventDefault();
      return;
    }
    this._dragging = { col: th.dataset.col, th };
    th.classList.add("p05-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", th.dataset.col);
    const ghost = th.cloneNode(true);
    ghost.style.cssText = "position:absolute;top:-9999px;opacity:0.8;background:var(--p05-bg-surface);";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 50, 20);
    setTimeout(() => ghost.remove(), 0);
  },
  _onDragOver(e) {
    if (!this._dragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const th = e.target.closest("th[data-col]");
    if (!th || th === this._dragging.th) return;
    const col = TABLE_COLUMNS.find((c) => c.id === th.dataset.col);
    if (!col?.reorderable) return;
    this._container.querySelectorAll("th.p05-drag-over").forEach((el) => {
      el.classList.remove("p05-drag-over");
    });
    th.classList.add("p05-drag-over");
  },
  _onDrop(e) {
    if (!this._dragging) return;
    e.preventDefault();
    const th = e.target.closest("th[data-col]");
    if (!th || th === this._dragging.th) return;
    const targetCol = TABLE_COLUMNS.find((c) => c.id === th.dataset.col);
    if (!targetCol?.reorderable) return;
    const fromId = this._dragging.col;
    const toId = th.dataset.col;
    const fromIdx = this._state.columnOrder.indexOf(fromId);
    const toIdx = this._state.columnOrder.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    this._state.columnOrder.splice(fromIdx, 1);
    this._state.columnOrder.splice(toIdx, 0, fromId);
    this._state.saveColumnOrder();
    this._state.shellRendered = false;
    this.render();
    this.emit(TABLE_EVENTS.COLUMN_REORDER, { order: this._state.columnOrder });
  },
  _onDragEnd() {
    if (!this._dragging) return;
    this._dragging.th.classList.remove("p05-dragging");
    this._container.querySelectorAll("th.p05-drag-over").forEach((el) => {
      el.classList.remove("p05-drag-over");
    });
    this._dragging = null;
  },
  _resetColumnOrder() {
    this._state.resetColumnOrder();
    this._state.shellRendered = false;
    this.render();
    this.emit(TABLE_EVENTS.COLUMN_REORDER, { order: this._state.columnOrder });
  },
  _toggleColumnMenu() {
    this._state.columnMenuOpen = !this._state.columnMenuOpen;
    this._container.querySelector(".p05-column-toggle")?.classList.toggle(
      "p05-open",
      // @ts-expect-error strict migration — TS2339
      this._state.columnMenuOpen
    );
  },
  _toggleColumn(colId) {
    this._state.toggleColumnVisibility(colId);
    this._applyHiddenColumns();
  },
  _applyHiddenColumns() {
    TABLE_COLUMNS.forEach((col) => {
      const isHidden = this._state.isColumnHidden(col.id);
      this._container.querySelectorAll(`[data-col="${col.id}"]`).forEach((el) => {
        el.classList.toggle("p05-col-hidden", isHidden);
      });
    });
  },
  _pinColumn(colId, side) {
    this._state.pinColumn(colId, side);
    this._applyPinnedColumns();
  },
  _unpinColumn(colId) {
    this._state.unpinColumn(colId);
    this._applyPinnedColumns();
  },
  _applyPinnedColumns() {
    this._container.querySelectorAll("[data-col]").forEach((el) => {
      el.classList.remove("p05-pinned-left", "p05-pinned-right");
      const pin = this._state.getColumnPin(el.dataset.col);
      if (pin === "left") el.classList.add("p05-pinned-left");
      if (pin === "right") el.classList.add("p05-pinned-right");
    });
  },
  _getOrderedColumns() {
    return this._state.columnOrder.map((id) => TABLE_COLUMNS.find((c) => c.id === id)).filter(Boolean);
  }
};
var columns_default = ColumnsMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { columnsReady: true } };
}
export {
  ColumnsMixin,
  MODULE_ID,
  VERSION,
  columns_default as default,
  healthCheck,
  info
};
