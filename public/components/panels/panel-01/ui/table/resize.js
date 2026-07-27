const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/resize";
class ColumnResize {
  constructor(tableEl, options = {}) {
    this.table = tableEl;
    this.onResize = options.onResize || (() => {
    });
    this.minWidth = options.minWidth || 50;
    this.maxWidth = options.maxWidth || 500;
    this._resizing = false;
    this._startX = 0;
    this._startWidth = 0;
    this._currentTh = null;
    this._abortController = null;
  }
  init() {
    if (!this.table) return;
    this._abortController = new AbortController();
    const signal = this._abortController.signal;
    const headers = this.table.querySelectorAll('th[data-resizable="true"]');
    headers.forEach((th) => {
      const thEl = th;
      const handle = document.createElement("div");
      handle.className = "p01-resize-handle";
      handle.addEventListener("mousedown", (e) => this._onMouseDown(e, thEl), { signal });
      thEl.style.position = "relative";
      thEl.appendChild(handle);
    });
    document.addEventListener("mousemove", (e) => this._onMouseMove(e), { signal });
    document.addEventListener("mouseup", () => this._onMouseUp(), { signal });
  }
  _onMouseDown(e, th) {
    e.preventDefault();
    this._resizing = true;
    this._currentTh = th;
    this._startX = e.pageX;
    this._startWidth = th.offsetWidth;
    th.classList.add("p01-resizing");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }
  _onMouseMove(e) {
    if (!this._resizing || !this._currentTh) return;
    const diff = e.pageX - this._startX;
    const newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this._startWidth + diff));
    this._currentTh.style.width = `${newWidth}px`;
    this._currentTh.style.minWidth = `${newWidth}px`;
  }
  _onMouseUp() {
    if (!this._resizing) return;
    this._resizing = false;
    if (this._currentTh) {
      this._currentTh.classList.remove("p01-resizing");
      const colId = this._currentTh.dataset.column;
      const width = this._currentTh.offsetWidth;
      this.onResize(colId, width);
    }
    this._currentTh = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }
  setWidth(colId, width) {
    const th = this.table.querySelector(`th[data-column="${colId}"]`);
    if (th) {
      th.style.width = `${width}px`;
      th.style.minWidth = `${width}px`;
    }
  }
  getWidths() {
    const widths = {};
    this.table.querySelectorAll("th[data-column]").forEach((th) => {
      const thEl = th;
      if (thEl.dataset.column) widths[thEl.dataset.column] = thEl.offsetWidth;
    });
    return widths;
  }
  destroy() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._resizing = false;
    this._currentTh = null;
  }
}
function createColumnResize(table, options = {}) {
  return new ColumnResize(table, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var resize_default = { ColumnResize, createColumnResize };
export {
  ColumnResize,
  MODULE_ID,
  VERSION,
  createColumnResize,
  resize_default as default,
  healthCheck,
  info
};
