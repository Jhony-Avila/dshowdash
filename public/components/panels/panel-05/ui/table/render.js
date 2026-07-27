import { DENSITY_MODES } from "./render-constants.js";
import { renderShell } from "./render-shell.js";
import { updateTableBody, diffUpdateRows } from "./render-body.js";
import { createRowElement, updateRowElement, renderRowCells } from "./render-rows.js";
import { updateFooter, renderPagination } from "./render-footer.js";
import { renderSearchBox, renderExportButton, renderBulkActionsBar } from "./render-toolbar.js";
import { renderDensityToggle, renderScrollModeToggle, renderColumnToggle } from "./render-controls.js";
import { renderTableHeaderByCol, renderSkeleton } from "./render-header.js";
const RenderMixin = {
  render() {
    if (!this._container) return "";
    this._renderShell();
    this._updateTableBody();
    this._updateFooter();
    this._applyHiddenColumns();
    this._applyPinnedColumns();
    this._setDensity(this._state.density);
    this._updateBulkBar();
    this._updateCheckboxes();
    this._updateSearchInfo();
  },
  // @ts-expect-error strict migration — TS2345
  _renderShell() {
    renderShell(this);
  },
  // @ts-expect-error strict migration — TS2345
  _updateTableBody() {
    updateTableBody(this);
  },
  // @ts-expect-error strict migration — TS2345
  _diffUpdateRows(tbody, newData, startIdx, orderedCols, topRow, bottomRow) {
    diffUpdateRows(this, tbody, newData, startIdx, orderedCols, topRow, bottomRow);
  },
  // @ts-expect-error strict migration — TS2345
  _createRowElement(item, idx, orderedCols) {
    return createRowElement(this, item, idx, orderedCols);
  },
  // @ts-expect-error strict migration — TS2345
  _updateRowElement(row, item, idx, orderedCols) {
    updateRowElement(this, row, item, idx, orderedCols);
  },
  // @ts-expect-error strict migration — TS2345
  _renderRowCells(item, orderedCols) {
    return renderRowCells(this, item, orderedCols);
  },
  // @ts-expect-error strict migration — TS2345
  _updateFooter() {
    updateFooter(this);
  },
  _renderPagination(page, total, count) {
    return renderPagination(page, total, count);
  },
  // @ts-expect-error strict migration — TS2345
  _renderSearchBox() {
    return renderSearchBox(this);
  },
  // @ts-expect-error strict migration — TS2345
  _renderExportButton() {
    return renderExportButton(this);
  },
  // @ts-expect-error strict migration — TS2345
  _renderBulkActionsBar() {
    return renderBulkActionsBar(this);
  },
  // @ts-expect-error strict migration — TS2345
  _renderDensityToggle() {
    return renderDensityToggle(this);
  },
  // @ts-expect-error strict migration — TS2345
  _renderScrollModeToggle() {
    return renderScrollModeToggle(this);
  },
  // @ts-expect-error strict migration — TS2345
  _renderColumnToggle() {
    return renderColumnToggle(this);
  },
  // @ts-expect-error strict migration — TS2345
  _renderTableHeaderByCol(col) {
    return renderTableHeaderByCol(this, col);
  },
  renderSkeleton() {
    return renderSkeleton();
  },
  _setDensity(mode) {
    if (!DENSITY_MODES.includes(mode)) return;
    this._state.setDensity(mode);
    const table = this._container.querySelector(".p05-table");
    if (table) {
      DENSITY_MODES.forEach((d) => table.classList.remove(`p05-density-${d}`));
      table.classList.add(`p05-density-${mode}`);
    }
    this._container.querySelectorAll(".p05-density-btn").forEach((btn) => {
      btn.classList.toggle("p05-active", btn.dataset.density === mode);
    });
    if (this._state.scrollMode === "virtual") this._updateVirtualRows();
  }
};
const MODULE_ID = "panel-05:table:render";
const VERSION = "9.3.0-P2-ENTERPRISE";
RenderMixin.VERSION = VERSION;
RenderMixin.MODULE_ID = MODULE_ID;
var render_default = RenderMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderReady: true } };
}
export {
  MODULE_ID,
  RenderMixin,
  VERSION,
  render_default as default,
  healthCheck,
  info
};
