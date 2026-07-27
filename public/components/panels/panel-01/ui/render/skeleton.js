const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/render/skeleton";
function renderTableSkeleton(columns = 8, rows = 10) {
  const widths = [50, 200, 100, 100, 150, 90, 80, 40];
  const rowsHtml = Array(rows).fill(0).map(() => `
    <tr class="p01-skeleton-row">
      ${Array(columns).fill(0).map(
    (_, i) => `<td><div class="p01-skeleton" style="width:${widths[i % widths.length]}px"></div></td>`
  ).join("")}
    </tr>
  `).join("");
  return `
    <div class="p01-table-wrapper">
      <table class="p01-table p01-table--loading">
        <thead>
          <tr>${Array(columns).fill('<th><div class="p01-skeleton" style="width:60px"></div></th>').join("")}</tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}
function renderKPISkeleton() {
  return `
    <div class="p01-kpis p01-kpis--loading">
      ${Array(6).fill(`
        <div class="p01-kpi-card p01-kpi-card--skeleton">
          <div class="p01-skeleton p01-skeleton--icon"></div>
          <div class="p01-kpi-content">
            <div class="p01-skeleton" style="width:80px;height:12px;margin-bottom:8px"></div>
            <div class="p01-skeleton" style="width:60px;height:20px"></div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var skeleton_default = { renderTableSkeleton, renderKPISkeleton };
export {
  MODULE_ID,
  VERSION,
  skeleton_default as default,
  healthCheck,
  info,
  renderKPISkeleton,
  renderTableSkeleton
};
