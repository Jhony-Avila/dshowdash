import { ICONS, STATUS_CONFIG, CATEGORY_CONFIG } from "./constants.js";
function renderSkeleton() {
  return `<div class="phd-dashboard" style="padding:16px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="phd-skeleton" style="width:200px;height:24px;"></div><div class="phd-skeleton" style="width:100px;height:32px;"></div></div><div class="phd-card" style="padding:16px;margin-bottom:16px;"><div class="phd-skeleton" style="width:100%;height:80px;"></div></div>${[1, 2, 3].map(() => `<div class="phd-card" style="padding:12px;margin-bottom:8px;"><div class="phd-skeleton" style="width:150px;height:16px;margin-bottom:8px;"></div><div class="phd-skeleton" style="width:100%;height:40px;"></div></div>`).join("")}</div>`;
}
function renderSummaryCard(label, value, color, icon) {
  return `<div class="phd-card" style="padding:12px;text-align:center;"><div style="display:flex;justify-content:center;margin-bottom:6px;"><span class="phd-icon" style="color:${color};">${icon}</span></div><div style="font-size:22px;font-weight:700;color:${color};">${value}</div><div style="font-size:10px;color:#606070;text-transform:uppercase;">${label}</div></div>`;
}
function renderModuleRow(name, data) {
  const statusCfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.UNKNOWN;
  const scoreDisplay = data.score !== null ? `${data.score}%` : "--";
  return `<div class="phd-module-row" data-action="view-module" data-module="${name}"><span class="phd-icon" style="color:${statusCfg.color};">${ICONS[statusCfg.icon]}</span><span style="flex:1;font-size:11px;color:#a0a0b0;">${name}</span><span style="font-size:11px;color:#606070;min-width:50px;text-align:right;">${data.version || "--"}</span><span style="font-size:11px;font-weight:600;color:${statusCfg.color};min-width:40px;text-align:right;">${scoreDisplay}</span><span class="phd-badge" style="background:${statusCfg.bg};color:${statusCfg.color};min-width:70px;justify-content:center;">${statusCfg.label}</span></div>`;
}
function renderCategory(catKey, modules, expandedCategories) {
  const catConfig = CATEGORY_CONFIG[catKey] || { label: catKey, icon: "box" };
  const entries = Object.entries(modules);
  const healthyCount = entries.filter(([, m]) => m.status === "HEALTHY").length;
  const isExpanded = expandedCategories.has(catKey);
  return `<div class="phd-card"><div class="phd-category-header" data-action="toggle-category" data-category="${catKey}"><span class="phd-icon" style="color:#606070;transition:transform 0.2s;${isExpanded ? "" : "transform:rotate(-90deg);"}">${ICONS.chevronDown}</span><span class="phd-icon" style="color:#6366f1;">${ICONS[catConfig.icon] || ICONS.box}</span><span style="flex:1;font-size:12px;font-weight:600;color:#f0f0f5;">${catConfig.label}</span><span class="phd-badge" style="background:rgba(99,102,241,0.15);color:#a78bfa;">${healthyCount}/${entries.length}</span></div><div class="phd-category-content ${isExpanded ? "" : "collapsed"}" data-category-content="${catKey}" style="max-height:${isExpanded ? `${entries.length * 50}px` : "0"};">${entries.map(([name, data]) => renderModuleRow(name, data)).join("")}</div></div>`;
}
function renderDashboard(state, config, expandedCategories) {
  const { snapshot, loading, lastUpdate } = state;
  const overall = STATUS_CONFIG[snapshot?.overallStatus] || STATUS_CONFIG.UNKNOWN;
  const summary = snapshot?.summary || { healthy: 0, degraded: 0, unhealthy: 0, unavailable: 0, total: 0 };
  const _icons = ICONS;
  return `<div class="phd-dashboard phd-animate" style="display:flex;flex-direction:column;gap:16px;padding:16px;"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;"><div style="display:flex;align-items:center;gap:10px;"><span class="phd-icon" style="color:#6366f1;">${ICONS.activity}</span><h2 style="margin:0;font-size:16px;font-weight:600;color:#f0f0f5;">System Health Dashboard</h2><span class="phd-badge" style="background:${overall.bg};color:${overall.color};"><span class="phd-icon">${_icons[overall.icon]}</span>${overall.label}</span></div><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:10px;color:#606070;">${lastUpdate ? new Date(lastUpdate).toLocaleTimeString("pt-BR") : "--"}</span><label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#606070;cursor:pointer;"><input type="checkbox" data-action="toggle-auto-refresh" ${config.autoRefresh ? "checked" : ""} style="accent-color:#6366f1;">Auto</label><button class="phd-btn" data-action="refresh" ${loading ? "disabled" : ""}><span class="phd-icon ${loading ? "phd-spin" : ""}">${ICONS.refresh}</span>Refresh</button></div></div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;">${renderSummaryCard("Score", `${snapshot?.overallScore || 0}%`, overall.color, ICONS.activity)}${renderSummaryCard("Healthy", summary.healthy, "#22c55e", ICONS.check)}${renderSummaryCard("Degraded", summary.degraded, "#f59e0b", ICONS.alertTriangle)}${renderSummaryCard("Unhealthy", summary.unhealthy, "#ef4444", ICONS.x)}${renderSummaryCard("Unavailable", summary.unavailable, "#606070", ICONS.circle)}</div><div style="display:flex;flex-direction:column;gap:8px;">${Object.entries(snapshot?.categories || {}).map(([catKey, modules]) => renderCategory(catKey, modules, expandedCategories)).join("")}</div></div>`;
}
var render_default = { renderSkeleton, renderSummaryCard, renderModuleRow, renderCategory, renderDashboard };
const MODULE_ID = "panels-panels-panel-health-dashboard-render";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  render_default as default,
  healthCheck,
  info,
  renderCategory,
  renderDashboard,
  renderModuleRow,
  renderSkeleton,
  renderSummaryCard
};
