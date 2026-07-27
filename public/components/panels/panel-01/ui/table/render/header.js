import { COLUMNS } from "../constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/render/header";
const SORT_SVGS = {
  asc: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  desc: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
};
function renderHeader(options = {}) {
  const opts = options || {};
  const columns = opts.columns || COLUMNS;
  const sort = opts.sort || {};
  const allSelected = opts.allSelected || false;
  const multiSorts = opts.multiSorts || [];
  const visibleCols = columns.filter((c) => c.visible);
  const cells = visibleCols.map((col, _index) => {
    if (col.id === "select") {
      return `<th class="p01-th-select" data-column="select"><input type="checkbox" class="p01-select-all" ${allSelected ? "checked" : ""} aria-label="Selecionar todos"></th>`;
    }
    if (col.id === "actions") {
      return '<th class="p01-th-actions" data-column="actions"></th>';
    }
    let isSorted = sort.field === col.field;
    let sortOrder = isSorted ? sort.order : null;
    let multiSortIndex = null;
    for (let i = 0; i < multiSorts.length; i++) {
      if (multiSorts[i].field === col.field) {
        multiSortIndex = i + 1;
        sortOrder = multiSorts[i].order;
        isSorted = true;
        break;
      }
    }
    let sortIcon = "";
    if (isSorted) {
      sortIcon = sortOrder === "ASC" ? SORT_SVGS.asc : SORT_SVGS.desc;
      if (multiSortIndex) {
        sortIcon = `<span class="p01-multi-sort-index">${multiSortIndex}</span>${sortIcon}`;
      }
    }
    const classes = [`p01-th-${col.id}`];
    if (col.sortable) classes.push("p01-th--sortable");
    if (isSorted) classes.push("p01-th--sorted");
    if (col.align) classes.push(`p01-th--${col.align}`);
    const attrs = [];
    attrs.push(`class="${classes.join(" ")}"`);
    attrs.push(`data-column="${col.id}"`);
    if (col.sortable) {
      attrs.push(`data-sort="${col.field}"`);
      attrs.push('data-draggable="true"');
      attrs.push('data-resizable="true"');
    }
    if (col.width) {
      attrs.push(`style="width:${col.width}px;min-width:${col.width}px"`);
    }
    let content = `<span class="p01-th-content">${col.label}`;
    if (sortIcon) {
      content += `<span class="p01-sort-icon">${sortIcon}</span>`;
    }
    content += "</span>";
    return `<th ${attrs.join(" ")}>${content}</th>`;
  }).join("");
  return `<thead><tr>${cells}</tr></thead>`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var header_default = { renderHeader, SORT_SVGS };
export {
  MODULE_ID,
  SORT_SVGS,
  VERSION,
  header_default as default,
  healthCheck,
  info,
  renderHeader
};
