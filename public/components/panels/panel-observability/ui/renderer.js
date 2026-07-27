import { ICONS } from "../core/constants.js";
import { formatNumber, formatPercent, formatMs, formatRelative, formatHealthStatus, escapeHtml } from "../utils/formatters.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-observability/ui/renderer";
function renderHeader(state) {
  return `<div class="obs-header"><h3 class="obs-title">${ICONS.barChart} Observability</h3><span class="obs-status ${(state.health?.status || "unknown").toLowerCase()}">${formatHealthStatus(state.health?.status || "")}</span></div>`;
}
function renderMetrics(state) {
  const m = state.metrics || {};
  return `<div class="obs-metrics">${renderMetricCard("CPU", formatPercent(m.cpu), (m.cpu ?? 0) > 80 ? "warning" : "normal")}${renderMetricCard("Mem\xF3ria", formatPercent(m.memory), (m.memory ?? 0) > 80 ? "warning" : "normal")}${renderMetricCard("Requests", formatNumber(m.requests), "normal")}${renderMetricCard("Lat\xEAncia", formatMs(m.latency ?? 0), (m.latency ?? 0) > 1e3 ? "warning" : "normal")}</div>`;
}
function renderMetricCard(label, value, status = "normal") {
  return `<div class="metric-card metric-card--${status}"><span class="metric-value">${value}</span><span class="metric-label">${escapeHtml(label)}</span></div>`;
}
function renderActions(state) {
  const a = state.actions || {};
  return `<div class="obs-actions"><div class="action-stat"><span class="stat-value">${formatNumber(a.total)}</span><span class="stat-label">Total</span></div><div class="action-stat success"><span class="stat-value">${formatNumber(a.accepted)}</span><span class="stat-label">Aceitas</span></div><div class="action-stat error"><span class="stat-value">${formatNumber(a.errors)}</span><span class="stat-label">Erros</span></div><div class="action-stat"><span class="stat-value">${formatNumber(a.perMinute)}/min</span><span class="stat-label">Taxa</span></div></div>`;
}
function renderModulesList(modules) {
  if (!modules || Object.keys(modules).length === 0) return '<div class="obs-empty">Nenhum m\xF3dulo</div>';
  return `<ul class="obs-modules">${Object.entries(modules).map(
    ([name, data]) => (
      // @ts-expect-error TS migration - TS2339
      `<li class="module-item module-item--${(data.status || "unknown").toLowerCase()}"><span class="module-icon">${getStatusIcon(data.status)}</span><span class="module-name">${escapeHtml(name)}</span><span class="module-status">${data.status || "unknown"}</span></li>`
    )
  ).join("")}</ul>`;
}
function renderRecentErrors(errors) {
  if (!errors || errors.length === 0) return '<div class="obs-empty">Sem erros recentes</div>';
  return `<ul class="obs-errors">${errors.slice(0, 10).map(
    (e) => `<li class="error-item"><span class="error-time">${formatRelative(e.timestamp)}</span><span class="error-msg">${escapeHtml(e.error?.message || String(e.error))}</span></li>`
  ).join("")}</ul>`;
}
function getStatusIcon(status) {
  if (status === "HEALTHY") return ICONS.check;
  if (status === "UNHEALTHY") return ICONS.x;
  if (status === "DEGRADED") return ICONS.warning;
  return "?";
}
function renderSkeleton() {
  return '<div class="obs-skeleton"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>';
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var renderer_default = { renderHeader, renderMetrics, renderMetricCard, renderActions, renderModulesList, renderRecentErrors, renderSkeleton };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  healthCheck,
  info,
  renderActions,
  renderHeader,
  renderMetricCard,
  renderMetrics,
  renderModulesList,
  renderRecentErrors,
  renderSkeleton
};
