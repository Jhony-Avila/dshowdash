const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/drag-drop";
class ColumnDragDrop {
  constructor(tableEl, options = {}) {
    this.table = tableEl;
    this.onReorder = options.onReorder || (() => {
    });
    this.draggedEl = null;
    this.draggedIndex = null;
    this.placeholder = null;
    this._enabled = true;
  }
  init() {
    if (!this.table) return;
    const headers = this.table.querySelectorAll('th[data-draggable="true"]');
    headers.forEach((th, index) => {
      th.setAttribute("draggable", "true");
      th.addEventListener("dragstart", (e) => this._onDragStart(e, index));
      th.addEventListener("dragover", (e) => this._onDragOver(e));
      th.addEventListener("dragenter", (e) => this._onDragEnter(e));
      th.addEventListener("dragleave", (e) => this._onDragLeave(e));
      th.addEventListener("drop", (e) => this._onDrop(e, index));
      th.addEventListener("dragend", (e) => this._onDragEnd(e));
    });
  }
  _onDragStart(e, index) {
    if (!this._enabled) {
      e.preventDefault();
      return;
    }
    this.draggedEl = e.target.closest("th");
    this.draggedIndex = index;
    this.draggedEl.classList.add("p01-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }
  _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  _onDragEnter(e) {
    const th = e.target.closest("th");
    if (th && th !== this.draggedEl) th.classList.add("p01-drag-over");
  }
  _onDragLeave(e) {
    const th = e.target.closest("th");
    if (th) th.classList.remove("p01-drag-over");
  }
  _onDrop(e, targetIndex) {
    e.preventDefault();
    const th = e.target.closest("th");
    if (th) th.classList.remove("p01-drag-over");
    if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
      this.onReorder(this.draggedIndex, targetIndex);
    }
  }
  _onDragEnd(_e) {
    if (this.draggedEl) this.draggedEl.classList.remove("p01-dragging");
    this.table.querySelectorAll(".p01-drag-over").forEach((el) => el.classList.remove("p01-drag-over"));
    this.draggedEl = null;
    this.draggedIndex = null;
  }
  enable() {
    this._enabled = true;
  }
  disable() {
    this._enabled = false;
  }
  destroy() {
    this._enabled = false;
  }
}
function createColumnDragDrop(table, options = {}) {
  return new ColumnDragDrop(table, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var drag_drop_default = { ColumnDragDrop, createColumnDragDrop };
export {
  ColumnDragDrop,
  MODULE_ID,
  VERSION,
  createColumnDragDrop,
  drag_drop_default as default,
  healthCheck,
  info
};
