import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "13.3.0-VISUAL-ENHANCEMENTS";
const MODULE_ID = "panel-nav-admin.ui.skeleton-loader";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const SKELETON_CLASS = "pna-skeleton";
function _line(size) {
  return '<div class="' + SKELETON_CLASS + "-line " + SKELETON_CLASS + "-" + size + '"></div>';
}
function renderKPISkeleton(count) {
  if (count === void 0) count = 4;
  let html = "";
  for (let i = 0; i < count; i++) {
    html += '<div class="' + SKELETON_CLASS + '-kpi">' + _line("short") + '<div class="' + SKELETON_CLASS + '-circle"></div>' + _line("medium") + "</div>";
  }
  return '<div class="' + SKELETON_CLASS + '-kpis">' + html + "</div>";
}
function renderFiltersSkeleton() {
  return '<div class="' + SKELETON_CLASS + '-filters">' + _line("long") + _line("medium") + _line("short") + "</div>";
}
function renderItemsSkeleton(rows) {
  if (rows === void 0) rows = 8;
  let items = "";
  const sizes = ["long", "medium", "short", "medium"];
  for (let i = 0; i < rows; i++) {
    const s1 = sizes[i % sizes.length];
    const s2 = sizes[(i + 1) % sizes.length];
    items += '<div class="' + SKELETON_CLASS + '-item"><div class="' + SKELETON_CLASS + '-avatar"></div><div class="' + SKELETON_CLASS + '-item-content">' + _line(s1) + _line(s2) + "</div>" + _line("short") + "</div>";
  }
  return '<div class="' + SKELETON_CLASS + '-list">' + items + "</div>";
}
function renderTableSkeleton(rows, cols) {
  if (rows === void 0) rows = 8;
  if (cols === void 0) cols = 5;
  let header = "<tr>";
  for (let c = 0; c < cols; c++) {
    header += '<th><div class="' + SKELETON_CLASS + "-line " + SKELETON_CLASS + '-medium"></div></th>';
  }
  header += "</tr>";
  let body = "";
  const sizes = ["long", "medium", "short", "full", "medium"];
  for (let r = 0; r < rows; r++) {
    body += "<tr>";
    for (let c = 0; c < cols; c++) {
      const size = sizes[(r + c) % sizes.length];
      body += '<td><div class="' + SKELETON_CLASS + "-line " + SKELETON_CLASS + "-" + size + '"></div></td>';
    }
    body += "</tr>";
  }
  return '<div class="' + SKELETON_CLASS + '-table-wrap"><table class="' + SKELETON_CLASS + '-table"><thead>' + header + "</thead><tbody>" + body + "</tbody></table></div>";
}
function renderPaginationSkeleton() {
  return '<div class="' + SKELETON_CLASS + '-pagination">' + _line("short") + _line("medium") + _line("short") + "</div>";
}
function renderFullSkeleton(rows) {
  return '<div class="' + SKELETON_CLASS + " " + SKELETON_CLASS + '--animated">' + renderKPISkeleton(4) + renderFiltersSkeleton() + renderItemsSkeleton(rows) + renderPaginationSkeleton() + "</div>";
}
function showSkeleton(container, rows, variant) {
  if (!container) return;
  if (rows === void 0) rows = 8;
  if (variant === void 0) variant = "items";
  let html;
  switch (variant) {
    case "table":
      html = renderTableSkeleton(rows);
      break;
    case "full":
      html = renderFullSkeleton(rows);
      break;
    default:
      html = renderItemsSkeleton(rows);
  }
  container.insertAdjacentHTML("afterbegin", '<div class="' + SKELETON_CLASS + "-wrapper " + SKELETON_CLASS + '--animated" data-skeleton>' + html + "</div>");
}
function hideSkeleton(container) {
  if (!container) return;
  const el = container.querySelector("[data-skeleton]");
  if (el) el.remove();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var skeleton_loader_default = {
  renderKPISkeleton,
  renderFiltersSkeleton,
  renderItemsSkeleton,
  renderTableSkeleton,
  renderPaginationSkeleton,
  renderFullSkeleton,
  showSkeleton,
  hideSkeleton,
  info,
  healthCheck,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  skeleton_loader_default as default,
  getPorts,
  healthCheck,
  hideSkeleton,
  info,
  injectPorts,
  renderFiltersSkeleton,
  renderFullSkeleton,
  renderItemsSkeleton,
  renderKPISkeleton,
  renderPaginationSkeleton,
  renderTableSkeleton,
  showSkeleton
};
