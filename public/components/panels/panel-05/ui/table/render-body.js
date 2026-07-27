import { ICONS } from "./constants.js";
import { escapeHtml } from "./utils.js";
import { createRowElement, updateRowElement } from "./render-rows.js";
function updateTableBody(ctx) {
  const tbody = ctx._state.refs.tbody;
  if (!tbody) return;
  const displayData = ctx._state.getDisplayData();
  const orderedCols = ctx._getOrderedColumns();
  if (!displayData?.length) {
    if (ctx._state.searchQuery) {
      tbody.innerHTML = `<tr><td colspan="${orderedCols.length}" class="p05-no-results"><span class="p05-no-results-icon">${ICONS.search}</span><span>Nenhum resultado para "${escapeHtml(ctx._state.searchQuery)}"</span></td></tr>`;
    } else {
      tbody.innerHTML = `<tr><td colspan="${orderedCols.length}" class="p05-table-empty-row"><span class="p05-empty-icon">${ICONS.inbox}</span><span>Nenhum cliente encontrado</span></td></tr>`;
    }
    return;
  }
  if (ctx._state.scrollMode === "virtual") {
    ctx._updateVirtualRows();
    return;
  }
  let dataToRender;
  if (ctx._state.scrollMode === "infinite") {
    dataToRender = displayData;
  } else {
    const start = (ctx._state.page - 1) * ctx._state.perPage;
    dataToRender = displayData.slice(start, start + ctx._state.perPage);
  }
  diffUpdateRows(ctx, tbody, dataToRender, 0, orderedCols, null, null);
  ctx._updateRowSelection();
  ctx._updateCheckboxes();
}
function diffUpdateRows(ctx, tbody, newData, startIdx, orderedCols, topRow, bottomRow) {
  const currentRows = Array.from(tbody.querySelectorAll("tr[data-cliente-id]"));
  const currentIds = new Set(currentRows.map((r) => r.dataset.clienteId));
  const newIds = new Set(newData.map((c) => String(c.id)));
  currentRows.forEach((row) => {
    const rowEl = row;
    if (!newIds.has(rowEl.dataset.clienteId)) {
      const expRow = tbody.querySelector(`tr.p05-tr-expansion[data-expand-id="${rowEl.dataset.clienteId}"]`);
      if (expRow) expRow.remove();
      rowEl.remove();
    }
  });
  let insertBefore = bottomRow;
  newData.forEach((item, i) => {
    const id = String(item.id);
    let row = tbody.querySelector(`tr[data-cliente-id="${id}"]`);
    if (!row) {
      row = createRowElement(ctx, item, startIdx + i, orderedCols);
      tbody.insertBefore(row, insertBefore);
    } else {
      updateRowElement(ctx, row, item, startIdx + i, orderedCols);
    }
    const expRow = tbody.querySelector(`tr.p05-tr-expansion[data-expand-id="${id}"]`);
    if (expRow && expRow.previousSibling !== row) row.after(expRow);
    insertBefore = row.nextSibling;
    if (insertBefore?.classList?.contains("p05-tr-expansion")) insertBefore = insertBefore.nextSibling;
  });
}
var render_body_default = { updateTableBody, diffUpdateRows };
const MODULE_ID = "panel-05:table:render-body";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  render_body_default as default,
  diffUpdateRows,
  healthCheck,
  info,
  updateTableBody
};
