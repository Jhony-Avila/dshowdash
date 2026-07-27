import { ICONS } from "./constants.js";
function renderTableHeaderByCol(ctx, col) {
  const colId = String(col.id);
  const width = ctx._state.columnWidths[colId] || col.width || "auto";
  const isHidden = ctx._state.isColumnHidden(colId);
  const pin = ctx._state.getColumnPin(colId);
  const sortInfo = ctx._state.sortColumns.find((s) => s.field === colId);
  const sortIdx = ctx._state.sortColumns.findIndex((s) => s.field === colId);
  const isActive = !!sortInfo;
  const sortIcon = isActive ? sortInfo.dir === "asc" ? ICONS.chevronUp : ICONS.chevronDown : "";
  const sortBadge = sortIdx > -1 && ctx._state.sortColumns.length > 1 ? `<span class="p05-sort-badge">${sortIdx + 1}</span>` : "";
  const resizer = col.resizable ? '<div class="p05-th-resizer"></div>' : "";
  const pinCls = pin === "left" ? "p05-pinned-left" : pin === "right" ? "p05-pinned-right" : "";
  const pinIcon = pin ? `<span class="p05-pin-indicator">${ICONS.pin}</span>` : "";
  const grip = col.reorderable ? `<span class="p05-th-grip" draggable="true" title="Arrastar para reordenar">${ICONS.gripVertical}</span>` : "";
  if (colId === "expand") return `<th class="p05-td-expand" data-col="expand"></th>`;
  if (colId === "checkbox") return `<th class="p05-th-checkbox" data-col="checkbox"><input type="checkbox" class="p05-checkbox p05-checkbox-all" aria-label="Selecionar todos"></th>`;
  const isSortable = col.sortable;
  const label = col.label || "";
  const widthStyle = typeof width === "number" ? `${width}px` : width;
  return `
    <th class="p05-th-${colId} ${isSortable ? "p05-th-sortable" : ""} ${isActive ? "p05-th-active" : ""} ${isHidden ? "p05-col-hidden" : ""} ${pinCls} ${col.reorderable ? "p05-th-reorderable" : ""}"
        data-col="${colId}"
        ${isSortable ? `data-action="sort" data-sort="${colId}"` : ""}
        role="columnheader"
        style="width:${widthStyle}">
        ${grip}${label}${pinIcon}
        <span class="p05-sort-indicator">${sortIcon}${sortBadge}</span>
        ${resizer}
    </th>
  `;
}
function renderSkeleton() {
  return `
    <div class="p05-skeleton-table">
      <div class="p05-skeleton-header"></div>
      ${Array(5).fill('<div class="p05-skeleton-row"></div>').join("")}
    </div>
  `;
}
var render_header_default = { renderTableHeaderByCol, renderSkeleton };
const MODULE_ID = "panel-05:table:render-header";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderHeaderReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  render_header_default as default,
  healthCheck,
  info,
  renderSkeleton,
  renderTableHeaderByCol
};
