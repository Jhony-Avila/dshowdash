import { ICONS } from "./constants.js";
import { renderSearchBox, renderExportButton, renderBulkActionsBar } from "./render-toolbar.js";
import { renderDensityToggle, renderScrollModeToggle, renderColumnToggle } from "./render-controls.js";
import { renderTableHeaderByCol } from "./render-header.js";
function renderShell(ctx) {
  if (ctx._state.shellRendered && ctx._state.refs.tbody) return;
  const orderedCols = ctx._getOrderedColumns();
  const scrollMode = ctx._state.scrollMode;
  const containerClass = scrollMode === "virtual" ? "p05-table-container p05-virtual-scroll p05-sticky-header" : scrollMode === "infinite" ? "p05-table-container p05-infinite-scroll p05-sticky-header" : "p05-table-container p05-sticky-header";
  ctx._container.innerHTML = `
    ${renderBulkActionsBar(ctx)}
    <div class="p05-table-toolbar">
      ${renderSearchBox(ctx)}
      <div class="p05-toolbar-right">
        <button class="p05-shortcuts-btn" data-action="show-shortcuts" title="Atalhos de teclado (?)">${ICONS.keyboard}</button>
        ${renderExportButton(ctx)}
        ${renderDensityToggle(ctx)}
        ${renderScrollModeToggle(ctx)}
        ${renderColumnToggle(ctx)}
      </div>
    </div>
    <div class="${containerClass}">
      <table class="p05-table p05-density-${ctx._state.density}" role="grid">
        <thead>
          <tr role="row">
            ${orderedCols.map((col) => renderTableHeaderByCol(ctx, col)).join("")}
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="p05-table-footer" data-region="footer"></div>
  `;
  ctx._state.refs = {
    tbody: ctx._container.querySelector(".p05-table tbody"),
    thead: ctx._container.querySelector(".p05-table thead"),
    table: ctx._container.querySelector(".p05-table"),
    container: ctx._container.querySelector(".p05-table-container"),
    footer: ctx._container.querySelector('[data-region="footer"]'),
    bulkBar: ctx._container.querySelector(".p05-bulk-bar"),
    searchInput: ctx._container.querySelector(".p05-search-input"),
    searchInfo: ctx._container.querySelector(".p05-search-info")
  };
  ctx._state.shellRendered = true;
}
var render_shell_default = { renderShell };
const MODULE_ID = "panel-05:table:render-shell";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderShellReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  render_shell_default as default,
  healthCheck,
  info,
  renderShell
};
