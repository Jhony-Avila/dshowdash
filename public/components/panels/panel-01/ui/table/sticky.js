const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/sticky";
class StickyColumns {
  constructor(tableEl, options = {}) {
    this.table = tableEl;
    this.leftColumns = options.leftColumns || ["select", "id"];
    this.rightColumns = options.rightColumns || ["actions"];
    this._applied = false;
  }
  apply() {
    if (!this.table || this._applied) return;
    let leftOffset = 0;
    this.leftColumns.forEach((colId) => {
      const cells = this.table.querySelectorAll(`[data-column="${colId}"]`);
      cells.forEach((cell) => {
        const cellEl = cell;
        cellEl.classList.add("p01-sticky", "p01-sticky--left");
        cellEl.style.left = `${leftOffset}px`;
        cellEl.style.zIndex = "2";
      });
      if (cells.length > 0) leftOffset += cells[0].offsetWidth;
    });
    let rightOffset = 0;
    [...this.rightColumns].reverse().forEach((colId) => {
      const cells = this.table.querySelectorAll(`[data-column="${colId}"]`);
      cells.forEach((cell) => {
        const cellEl = cell;
        cellEl.classList.add("p01-sticky", "p01-sticky--right");
        cellEl.style.right = `${rightOffset}px`;
        cellEl.style.zIndex = "2";
      });
      if (cells.length > 0) rightOffset += cells[0].offsetWidth;
    });
    this._applied = true;
  }
  remove() {
    if (!this.table) return;
    const stickyCells = this.table.querySelectorAll(".p01-sticky");
    stickyCells.forEach((cell) => {
      const cellEl = cell;
      cellEl.classList.remove("p01-sticky", "p01-sticky--left", "p01-sticky--right");
      cellEl.style.left = "";
      cellEl.style.right = "";
      cellEl.style.zIndex = "";
    });
    this._applied = false;
  }
  refresh() {
    this.remove();
    this.apply();
  }
  isApplied() {
    return this._applied;
  }
  setLeftColumns(cols) {
    this.leftColumns = cols;
    if (this._applied) this.refresh();
  }
  setRightColumns(cols) {
    this.rightColumns = cols;
    if (this._applied) this.refresh();
  }
}
function createStickyColumns(table, options = {}) {
  return new StickyColumns(table, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var sticky_default = { StickyColumns, createStickyColumns };
export {
  MODULE_ID,
  StickyColumns,
  VERSION,
  createStickyColumns,
  sticky_default as default,
  healthCheck,
  info
};
