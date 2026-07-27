import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { CONFIG } from "./dashboard-config.js";
import { escapeHtml } from "/core/utils/html-sanitizer.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.analytics.dashboard-templates";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const DT_SVGS = { close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', refresh: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>' };
function containerStyle() {
  return `position:fixed;top:10px;right:10px;width:400px;max-height:90vh;overflow-y:auto;background:${CONFIG.colors.background};border:1px solid ${CONFIG.colors.surface};border-radius:8px;padding:16px;z-index:99999;font-family:system-ui,sans-serif;color:${CONFIG.colors.text};box-shadow:0 4px 20px rgba(0,0,0,0.5);`;
}
function dashboardHTML() {
  return `<div class="dashboard-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h3 style="margin:0;font-size:14px;color:${CONFIG.colors.text};">\u{1F4CA} Router Analytics</h3><div><button id="dash-refresh" style="background:${CONFIG.colors.surface};border:none;color:${CONFIG.colors.text};padding:4px 8px;border-radius:4px;cursor:pointer;margin-right:4px;display:inline-flex;align-items:center;">${DT_SVGS.refresh}</button><button id="dash-close" style="background:${CONFIG.colors.danger};border:none;color:white;padding:4px 8px;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;">${DT_SVGS.close}</button></div></div><div class="dashboard-stats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;"><div class="stat-card" style="background:${CONFIG.colors.surface};padding:8px;border-radius:4px;text-align:center;"><div style="font-size:18px;font-weight:bold;" id="stat-total">0</div><div style="font-size:10px;color:${CONFIG.colors.textMuted};">Total Nav</div></div><div class="stat-card" style="background:${CONFIG.colors.surface};padding:8px;border-radius:4px;text-align:center;"><div style="font-size:18px;font-weight:bold;" id="stat-avgtime">0ms</div><div style="font-size:10px;color:${CONFIG.colors.textMuted};">Avg Time</div></div><div class="stat-card" style="background:${CONFIG.colors.surface};padding:8px;border-radius:4px;text-align:center;"><div style="font-size:18px;font-weight:bold;" id="stat-success">0%</div><div style="font-size:10px;color:${CONFIG.colors.textMuted};">Success</div></div><div class="stat-card" style="background:${CONFIG.colors.surface};padding:8px;border-radius:4px;text-align:center;"><div style="font-size:18px;font-weight:bold;" id="stat-active">0</div><div style="font-size:10px;color:${CONFIG.colors.textMuted};">Active</div></div></div><div class="dashboard-charts"><div style="margin-bottom:16px;"><canvas id="chart-navigations" width="368" height="120"></canvas></div><div style="margin-bottom:16px;"><canvas id="chart-resolve-time" width="368" height="120"></canvas></div><div style="margin-bottom:16px;"><canvas id="chart-top-routes" width="368" height="150"></canvas></div></div><div class="dashboard-recent" style="margin-top:16px;"><h4 style="font-size:12px;margin:0 0 8px 0;color:${CONFIG.colors.textMuted};">Recent Navigations</h4><div id="recent-list" style="max-height:150px;overflow-y:auto;font-size:11px;"></div></div><div class="dashboard-alerts" style="margin-top:16px;"><h4 style="font-size:12px;margin:0 0 8px 0;color:${CONFIG.colors.textMuted};">Alerts</h4><div id="alerts-list" style="font-size:11px;"></div></div>`;
}
function recentEntryHTML(entry) {
  const color = entry.success ? CONFIG.colors.success : CONFIG.colors.danger;
  const icon = entry.success ? DT_SVGS.check : DT_SVGS.x;
  return `<div style="padding:4px;margin-bottom:4px;background:${CONFIG.colors.surface};border-radius:4px;display:flex;align-items:center;"><span style="color:${color};margin-right:4px;display:flex;">${icon}</span><span style="color:${CONFIG.colors.text};flex:1;">${escapeHtml(entry.path || "/")}</span><span style="color:${CONFIG.colors.textMuted};">${entry.totalTime || 0}ms</span></div>`;
}
function alertHTML(alert) {
  const bgColor = alert.type === "danger" ? `${CONFIG.colors.danger}20` : `${CONFIG.colors.warning}20`;
  const borderColor = alert.type === "danger" ? CONFIG.colors.danger : CONFIG.colors.warning;
  return `<div style="padding:4px;margin-bottom:4px;background:${bgColor};border-radius:4px;border-left:3px solid ${borderColor};">${escapeHtml(alert.message)}</div>`;
}
function noAlertsHTML() {
  return `<div style="color:${CONFIG.colors.success};display:flex;align-items:center;gap:4px;">${DT_SVGS.check} Nenhum alerta</div>`;
}
function noDataHTML() {
  return `<div style="color:${CONFIG.colors.textMuted}">Sem dados de auditoria</div>`;
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
export {
  MODULE_ID,
  VERSION,
  alertHTML,
  containerStyle,
  dashboardHTML,
  getPorts,
  healthCheck,
  injectPorts,
  noAlertsHTML,
  noDataHTML,
  recentEntryHTML
};
