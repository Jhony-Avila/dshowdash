import { ICONS } from "./icons.js";
const MODULE_ID = "panel-nav-admin.ui.render-helpers";
const VERSION = "9.6.1-SVG-DIMENSIONS";
function renderSkeleton(count) {
  if (count === void 0) count = 5;
  let items = "";
  for (let i = 0; i < count; i++) {
    items += '<div class="pna-skeleton-item"><div class="pna-skeleton-line pna-skeleton-short"></div><div class="pna-skeleton-line pna-skeleton-long"></div><div class="pna-skeleton-line pna-skeleton-medium"></div></div>';
  }
  return '<div class="pna-skeleton-list">' + items + "</div>";
}
function renderEmptyState(title, message) {
  const icon = ICONS.nav.replace("<svg ", '<svg width="24" height="24" ');
  return '<div class="pna-empty-state"><div class="pna-empty-icon">' + icon + '</div><h3 class="pna-empty-title">' + title + '</h3><p class="pna-empty-message">' + message + "</p></div>";
}
function renderError(error) {
  var msg = error && typeof error !== "string" && error.message ? error.message : error;
  return '<div class="pna-error-banner"><span class="pna-error-icon">' + ICONS.alert + '</span><span class="pna-error-message">' + msg + '</span><button type="button" class="pna-btn-icon" data-action="dismiss-error">' + ICONS.x + "</button></div>";
}
function renderToast(message, type) {
  if (type === void 0) type = "success";
  var icon = type === "success" ? ICONS.check : type === "error" ? ICONS.alert : ICONS.nav;
  return '<div class="pna-toast pna-toast-' + type + '"><span class="pna-toast-icon">' + icon + '</span><span class="pna-toast-message">' + message + "</span></div>";
}
function renderKPIs(kpis, totalItems, totalSections) {
  var data = kpis || {};
  return '<div class="pna-kpis" data-region="kpis"><div class="pna-kpi pna-kpi-primary"><div class="pna-kpi-icon">' + ICONS.link + '</div><div class="pna-kpi-content"><span class="pna-kpi-label">Total Itens</span><span class="pna-kpi-value" data-kpi-value="totalItems">' + (totalItems || data.totalItems || 0) + '</span></div></div><div class="pna-kpi pna-kpi-secondary"><div class="pna-kpi-icon">' + ICONS.folder + '</div><div class="pna-kpi-content"><span class="pna-kpi-label">Se\xE7\xF5es</span><span class="pna-kpi-value" data-kpi-value="totalSections">' + (totalSections || data.totalSections || 0) + '</span></div></div><div class="pna-kpi pna-kpi-tertiary"><div class="pna-kpi-icon">' + ICONS.check + '</div><div class="pna-kpi-content"><span class="pna-kpi-label">Ativos</span><span class="pna-kpi-value" data-kpi-value="activeItems">' + (data.activeItems || totalItems || 0) + '</span></div></div><div class="pna-kpi pna-kpi-info"><div class="pna-kpi-icon">' + ICONS.shield + '</div><div class="pna-kpi-content"><span class="pna-kpi-label">Admin</span><span class="pna-kpi-value" data-kpi-value="adminItems">' + (data.adminItems || 0) + "</span></div></div></div>";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var render_helpers_default = {
  renderSkeleton,
  renderEmptyState,
  renderError,
  renderToast,
  renderKPIs,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  render_helpers_default as default,
  healthCheck,
  info,
  renderEmptyState,
  renderError,
  renderKPIs,
  renderSkeleton,
  renderToast
};
