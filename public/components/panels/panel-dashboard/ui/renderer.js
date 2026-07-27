const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-dashboard/ui/renderer";
const ICONS = {
  target: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  check: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  zap: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  barChart: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>'
};
function renderHeader(title) {
  return `<h2 class="dashboard-title">${ICONS.target} ${escapeHtml(title || "Dashboard")}</h2>`;
}
function renderStatusCards(state) {
  return `<div class="dashboard-cards">${renderCard("Sistema OK", ICONS.check, "blue")}${renderCard("Main Ativo", ICONS.zap, "green")}${renderCard("Pronto p/ Uso", ICONS.barChart, "orange")}</div>`;
}
function renderCard(label, icon, color) {
  const colors = { blue: "rgba(59,130,246", green: "rgba(34,197,94", orange: "rgba(245,158,11" };
  const c = colors[color] || colors.blue;
  return `<div class="status-card" style="background:${c},0.1);"><div class="card-icon" style="color:${c},1);">${icon}</div><div class="card-label">${escapeHtml(label)}</div></div>`;
}
function renderProps(props) {
  const propsStr = JSON.stringify(props || {}, null, 2);
  return `<div class="dashboard-props"><strong>Par\xE2metros recebidos:</strong><pre>${escapeHtml(propsStr)}</pre></div>`;
}
function renderWidgets(widgets) {
  if (!widgets || widgets.length === 0) return "";
  return `<div class="dashboard-widgets">${widgets.map((w) => `<div class="widget" data-widget-id="${w.id || ""}">${escapeHtml(w.title || "Widget")}</div>`).join("")}</div>`;
}
function renderSkeleton() {
  return '<div class="dashboard-skeleton"><div class="skeleton-header"></div><div class="skeleton-cards"></div></div>';
}
function renderError(error) {
  return `<div class="dashboard-error"><span class="error-icon">\u26A0\uFE0F</span><span>${escapeHtml(error?.message || "Erro desconhecido")}</span></div>`;
}
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var renderer_default = { renderHeader, renderStatusCards, renderCard, renderProps, renderWidgets, renderSkeleton, renderError };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  healthCheck,
  info,
  renderCard,
  renderError,
  renderHeader,
  renderProps,
  renderSkeleton,
  renderStatusCards,
  renderWidgets
};
