import { STATUS_TYPES } from "../core/constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-status/ui/renderer";
function renderStatusCard(statusId, data, config) {
  const cfg = config || STATUS_TYPES[statusId] || {};
  const level = data?.level || "unknown";
  const value = data?.value !== void 0 ? data.value : "--";
  const loading = data?.loading;
  return `<div class="status-card status-card--${level}" data-status-id="${statusId}" style="--status-color:${cfg.color || "#6c757d"}"><div class="status-icon">${getStatusIcon(cfg.icon)}</div><div class="status-content"><span class="status-label">${escapeHtml(cfg.label || statusId)}</span><span class="status-value">${loading ? '<span class="loading-dots">...</span>' : escapeHtml(String(value))}</span></div><div class="status-indicator status-indicator--${level}"></div></div>`;
}
function renderStatusGrid(statuses, configs) {
  let html = '<div class="status-grid">';
  for (const id in statuses) {
    if (Object.prototype.hasOwnProperty.call(statuses, id)) {
      html += renderStatusCard(id, statuses[id], configs?.[id]);
    }
  }
  html += "</div>";
  return html;
}
function renderOverallStatus(level) {
  const labels = { ok: "Sistema Operacional", warning: "Aten\xE7\xE3o Necess\xE1ria", error: "Problemas Detectados", unknown: "Verificando..." };
  return `<div class="overall-status overall-status--${level}"><span class="overall-icon">${getLevelIcon(level)}</span><span class="overall-label">${labels[level] || labels.unknown}</span></div>`;
}
function renderSkeleton(count) {
  let html = '<div class="status-grid">';
  for (let i = 0; i < (count || 4); i++) {
    html += '<div class="status-card status-card--skeleton"><div class="skeleton-icon"></div><div class="skeleton-content"><div class="skeleton-line"></div><div class="skeleton-line"></div></div></div>';
  }
  html += "</div>";
  return html;
}
function renderError(error) {
  return `<div class="status-error"><span class="error-icon">\u26A0\uFE0F</span><span>${escapeHtml(error?.message || "Erro ao carregar status")}</span></div>`;
}
function getStatusIcon(iconName) {
  const icons = {
    database: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    server: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    cloud: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    cpu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>',
    "hard-drive": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>',
    wifi: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
    activity: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
  };
  return icons[iconName] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
}
function getLevelIcon(level) {
  if (level === "ok") return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
  if (level === "warning") return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  if (level === "error") return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
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
var renderer_default = { renderStatusCard, renderStatusGrid, renderOverallStatus, renderSkeleton, renderError };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  healthCheck,
  info,
  renderError,
  renderOverallStatus,
  renderSkeleton,
  renderStatusCard,
  renderStatusGrid
};
