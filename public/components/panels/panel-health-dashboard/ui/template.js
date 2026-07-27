const MODULE_ID = "panel-health-dashboard-template";
const VERSION = "9.3.0-P2-ENTERPRISE";
const SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>',
  warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  circle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/></svg>',
  chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>'
};
function getStatusIcon(status) {
  switch (status) {
    case "HEALTHY":
      return SVGS.check;
    case "DEGRADED":
      return SVGS.warning;
    case "UNHEALTHY":
      return SVGS.x;
    case "UNAVAILABLE":
      return SVGS.circle;
    default:
      return "?";
  }
}
function getStatusClass(status) {
  return `phd-status-${(status || "unknown").toLowerCase()}`;
}
function formatTime(timestamp) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleTimeString();
}
function renderSummary(snapshot) {
  if (!snapshot) return "";
  const summary = snapshot.summary;
  const overallStatus = snapshot.overallStatus;
  const overallScore = snapshot.overallScore;
  return `<div class="phd-summary"><div class="phd-overall ${getStatusClass(overallStatus)}"><span class="phd-overall-icon">${getStatusIcon(overallStatus)}</span><span class="phd-overall-status">${overallStatus}</span><span class="phd-overall-score">${overallScore}%</span></div><div class="phd-stats"><div class="phd-stat phd-stat-healthy"><span class="phd-stat-value">${summary.healthy}</span><span class="phd-stat-label">Healthy</span></div><div class="phd-stat phd-stat-degraded"><span class="phd-stat-value">${summary.degraded}</span><span class="phd-stat-label">Degraded</span></div><div class="phd-stat phd-stat-unhealthy"><span class="phd-stat-value">${summary.unhealthy}</span><span class="phd-stat-label">Unhealthy</span></div><div class="phd-stat phd-stat-unavailable"><span class="phd-stat-value">${summary.unavailable}</span><span class="phd-stat-label">Unavailable</span></div></div></div>`;
}
function renderModule(name, data) {
  const scoreDisplay = data.score !== null ? `${data.score}%` : data.scoreDisplay || "-";
  return `<div class="phd-module ${getStatusClass(data.status)}" data-action="view-module" data-module="${name}"><span class="phd-module-icon">${getStatusIcon(data.status)}</span><span class="phd-module-name">${name}</span><span class="phd-module-score">${scoreDisplay}</span><span class="phd-module-version">${data.version || "-"}</span></div>`;
}
function renderCategory(name, label, modules) {
  const entries = [];
  for (const k in modules) {
    if (modules.hasOwnProperty(k)) entries.push([k, modules[k]]);
  }
  let healthyCount = 0;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i][1].status === "HEALTHY") healthyCount++;
  }
  let modulesHtml = "";
  for (let j = 0; j < entries.length; j++) {
    modulesHtml += renderModule(entries[j][0], entries[j][1]);
  }
  return `<div class="phd-category"><div class="phd-category-header" data-action="toggle-category" data-category="${name}"><span class="phd-category-toggle">${SVGS.chevronDown}</span><span class="phd-category-label">${label}</span><span class="phd-category-count">${healthyCount}/${entries.length}</span></div><div class="phd-category-content" data-category-content="${name}">${modulesHtml}</div></div>`;
}
function createTemplate(state) {
  const loading = state.loading;
  const error = state.error;
  const snapshot = state.snapshot;
  const lastUpdate = state.lastUpdate;
  if (loading && !snapshot) {
    return '<div class="phd-container"><div class="phd-header"><h2 class="phd-title">System Health Dashboard</h2></div><div class="phd-loading"><div class="phd-spinner"></div><span>Loading health data...</span></div></div>';
  }
  if (error && !snapshot) {
    return `<div class="phd-container"><div class="phd-header"><h2 class="phd-title">System Health Dashboard</h2><button class="phd-btn phd-btn-refresh" data-action="refresh">Retry</button></div><div class="phd-error"><span class="phd-error-icon">${SVGS.warning}</span><span class="phd-error-message">${error}</span></div></div>`;
  }
  const categoryLabels = { core: "Core Infrastructure", components: "Components", panels: "Panels" };
  let categoriesHtml = "";
  if (snapshot) {
    for (const catName in snapshot.categories) {
      if (snapshot.categories.hasOwnProperty(catName)) {
        categoriesHtml += renderCategory(catName, categoryLabels[catName] || catName, snapshot.categories[catName]);
      }
    }
  }
  const durationDisplay = snapshot && snapshot.collectionDuration ? snapshot.collectionDuration.toFixed(0) : "0";
  return `<div class="phd-container"><div class="phd-header"><h2 class="phd-title">System Health Dashboard</h2><div class="phd-controls"><label class="phd-auto-refresh"><input type="checkbox" data-action="toggle-auto-refresh" checked>Auto-refresh</label><button class="phd-btn phd-btn-refresh ${loading ? "loading" : ""}" data-action="refresh" ${loading ? "disabled" : ""}>${loading ? "..." : SVGS.refresh} Refresh</button></div></div>${snapshot ? renderSummary(snapshot) : ""}<div class="phd-categories">${categoriesHtml}</div><div class="phd-footer"><span class="phd-last-update">Last update: ${formatTime(lastUpdate)}</span><span class="phd-duration">${durationDisplay}ms</span></div></div>`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var template_default = createTemplate;
export {
  MODULE_ID,
  VERSION,
  createTemplate,
  template_default as default,
  healthCheck,
  info
};
