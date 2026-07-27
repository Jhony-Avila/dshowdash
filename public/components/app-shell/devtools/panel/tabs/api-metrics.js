import { icon, sanitizeAttr, getAppShell } from "../helpers.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.tabs.api-metrics";
function renderAPIMetricsTab() {
  const shell = getAppShell();
  if (!shell || !shell.apiMetrics) {
    return '<div class="dsd-ui-empty">APIUsageMetrics not available</div>';
  }
  try {
    const topAPIs = shell.apiMetrics.getTopAPIs(10);
    const unusedAPIs = shell.apiMetrics.getUnusedAPIs();
    const apisWithErrors = shell.apiMetrics.getAPIsWithErrors();
    const isEnabled = shell.apiMetrics.isEnabled();
    const metrics = shell.apiMetrics.info().metrics;
    const topList = topAPIs.length === 0 ? '<div class="dsd-ui-empty">No API calls tracked yet</div>' : `<div class="dsd-ui-list">${topAPIs.map((api) => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${sanitizeAttr(`${api.namespace}.${api.method}`)}</span><span class="dsd-ui-list-item__value">${api.calls}</span></div>`).join("")}</div>`;
    const errorsList = apisWithErrors.length === 0 ? '<div class="dsd-ui-empty">No errors</div>' : `<div class="dsd-ui-list">${apisWithErrors.slice(0, 5).map((api) => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label dsd-ui-status--unhealthy">${sanitizeAttr(`${api.namespace}.${api.method}`)}</span><span class="dsd-ui-list-item__value dsd-ui-status--unhealthy">${api.errors}</span></div>`).join("")}</div>`;
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("api")} API Usage Metrics</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn ${isEnabled ? "active" : ""}" id="btn-toggle-api">${icon(isEnabled ? "pause" : "play", 14)} ${isEnabled ? "Disable" : "Enable"}</button><button class="dsd-ui-btn" id="btn-reset-api">${icon("refresh", 14)} Reset</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Total Calls</div><div class="dsd-ui-card__value">${metrics.totalCalls}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Unique</div><div class="dsd-ui-card__value">${metrics.uniqueAPIs}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Errors</div><div class="dsd-ui-card__value ${metrics.totalErrors > 0 ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${metrics.totalErrors}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Unused</div><div class="dsd-ui-card__value">${unusedAPIs.length}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("zap")} Top 10 APIs</div>${topList}</div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("xCircle")} APIs with Errors</div>${errorsList}</div>`;
  } catch (e) {
    return `<div class="dsd-ui-empty">Error rendering API metrics: ${sanitizeAttr(e.message)}</div>`;
  }
}
export {
  MODULE_ID,
  VERSION,
  renderAPIMetricsTab
};
