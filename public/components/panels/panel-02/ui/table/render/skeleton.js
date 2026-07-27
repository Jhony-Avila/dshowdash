function renderSkeletonRows(columns, count = 10) {
  const visibleCols = columns.filter((c) => c.visible);
  let html = "";
  for (let i = 0; i < count; i++) {
    const cells = visibleCols.map((col) => {
      const widthStyle = col.width ? `style="width:${col.width}px"` : "";
      switch (col.id) {
        case "select":
          return `<td class="p02-checkbox-col p02-skeleton-cell-wrap" ${widthStyle}><div class="p02-skeleton-checkbox"></div></td>`;
        case "expand":
          return `<td class="p02-expand-col p02-skeleton-cell-wrap" ${widthStyle}><div class="p02-skeleton-expand"></div></td>`;
        case "job_name":
          return `<td class="p02-skeleton-cell-wrap"><div class="p02-skeleton-bar p02-skeleton-bar--name"></div></td>`;
        case "job_type":
          return `<td class="p02-skeleton-cell-wrap" ${widthStyle}><div class="p02-skeleton-badge"></div></td>`;
        case "health_status":
          return `<td class="p02-skeleton-cell-wrap center" ${widthStyle}><div class="p02-skeleton-status"></div></td>`;
        case "last_execution":
          return `<td class="p02-skeleton-cell-wrap" ${widthStyle}><div class="p02-skeleton-bar p02-skeleton-bar--date"></div></td>`;
        case "total_executions":
          return `<td class="p02-skeleton-cell-wrap ${col.align || ""}" ${widthStyle}><div class="p02-skeleton-bar p02-skeleton-bar--number"></div></td>`;
        case "success_rate":
          return `<td class="p02-skeleton-cell-wrap center" ${widthStyle}><div class="p02-skeleton-bar p02-skeleton-bar--percent"></div></td>`;
        case "avg_execution_time":
          return `<td class="p02-skeleton-cell-wrap ${col.align || ""}" ${widthStyle}><div class="p02-skeleton-bar p02-skeleton-bar--time"></div></td>`;
        case "error_count":
          return `<td class="p02-skeleton-cell-wrap ${col.align || ""}" ${widthStyle}><div class="p02-skeleton-bar p02-skeleton-bar--errors"></div></td>`;
        case "actions":
          return `<td class="p02-actions-col p02-skeleton-cell-wrap" ${widthStyle}><div class="p02-skeleton-actions"></div></td>`;
        default:
          return `<td class="p02-skeleton-cell-wrap"><div class="p02-skeleton-bar"></div></td>`;
      }
    }).join("");
    const zebraClass = i % 2 === 1 ? "p02-skeleton-row--even" : "";
    html += `<tr class="p02-skeleton-row ${zebraClass}" aria-hidden="true">${cells}</tr>`;
  }
  return html;
}
var skeleton_default = { renderSkeletonRows };
const MODULE_ID = "panel-02/ui/table/render/skeleton";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { skeletonReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  skeleton_default as default,
  healthCheck,
  info,
  renderSkeletonRows
};
