import { CSS_PREFIX, COLUMNS, TABS } from "./template-constants.js";
import { escapeHtml } from "./template-utils.js";
function buildTableHead(tab, options = {}) {
  const columns = COLUMNS[tab] || COLUMNS[TABS.AUDIT];
  const { showSelection = false, visibleColumns = null, showExpand = true, showInlineFilters = false, inlineFilterValues = {} } = options;
  let headerRow = `<tr class="${CSS_PREFIX}-header-row">`;
  if (showExpand) headerRow += '<th class="pat-expand-col" style="width:32px;"></th>';
  if (showSelection) headerRow += `<th class="${CSS_PREFIX}-select-cell"><input type="checkbox" class="${CSS_PREFIX}-row-checkbox" data-action="select-all"></th>`;
  columns.forEach((col) => {
    const hidden = visibleColumns && !visibleColumns.includes(col.key) ? " col-hidden" : "";
    headerRow += `<th class="${col.sortable ? "sortable" : ""}${hidden}" data-sort-key="${col.key}" data-col="${col.key}">${col.label}${col.sortable ? `<span class="${CSS_PREFIX}-sort-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M12 5v14M5 12l7-7 7 7"/></svg></span>` : ""}</th>`;
  });
  headerRow += "</tr>";
  let filterRow = "";
  if (showInlineFilters) {
    filterRow = `<tr class="${CSS_PREFIX}-inline-filters-row">`;
    if (showExpand) filterRow += "<td></td>";
    if (showSelection) filterRow += "<td></td>";
    columns.forEach((col) => {
      const hidden = visibleColumns && !visibleColumns.includes(col.key) ? " col-hidden" : "";
      const currentValue = inlineFilterValues[col.key] || "";
      if (col.filterable) {
        if (col.filterType === "select" && col.filterOptions) {
          filterRow += `<td class="${CSS_PREFIX}-inline-filter-cell${hidden}" data-col="${col.key}"><select class="${CSS_PREFIX}-inline-select" data-inline-filter="${col.key}"><option value="">Todos</option>${col.filterOptions.map((opt) => `<option value="${opt}"${currentValue === opt ? " selected" : ""}>${opt}</option>`).join("")}</select></td>`;
        } else {
          filterRow += `<td class="${CSS_PREFIX}-inline-filter-cell${hidden}" data-col="${col.key}"><input type="text" class="${CSS_PREFIX}-inline-input" data-inline-filter="${col.key}" placeholder="Filtrar..." value="${escapeHtml(currentValue)}"></td>`;
        }
      } else {
        filterRow += `<td class="${CSS_PREFIX}-inline-filter-cell${hidden}" data-col="${col.key}"></td>`;
      }
    });
    filterRow += "</tr>";
  }
  return headerRow + filterRow;
}
function buildSkeletonRows(count = 5, colspan = 8) {
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `<tr class="${CSS_PREFIX}-skeleton-row">`;
    for (let j = 0; j < colspan; j++) {
      const width = j === 0 ? "60%" : j === colspan - 1 ? "40px" : `${50 + Math.random() * 40}%`;
      html += `<td><div class="${CSS_PREFIX}-skeleton" style="width:${width};"></div></td>`;
    }
    html += "</tr>";
  }
  return html;
}
var template_head_default = { buildTableHead, buildSkeletonRows };
const MODULE_ID = "panels-panel-audit-trail-ui-template-head";
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
  buildSkeletonRows,
  buildTableHead,
  template_head_default as default,
  healthCheck,
  info
};
