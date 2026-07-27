import { icon, sanitizeAttr, formatTime, getAppShell } from "../helpers.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.tabs.region-metrics";
function renderRegionMetricsTab() {
  const shell = getAppShell();
  if (!shell || !shell.regionMetrics) {
    return '<div class="dsd-ui-empty">RegionMetrics not available</div>';
  }
  try {
    const allMetrics = shell.regionMetrics.getAllMetrics();
    const summary = shell.regionMetrics.getPerformanceSummary();
    const problematic = shell.regionMetrics.getProblematicRegions();
    const isEnabled = shell.regionMetrics.isEnabled();
    const regionsHtml = Object.keys(allMetrics).map((region) => {
      const m = allMetrics[region];
      const hasIssue = problematic.some((p) => p.region === region);
      return `<div class="dsd-ui-region-metric ${hasIssue ? "has-issue" : ""}"><div class="dsd-ui-region-metric__name">${sanitizeAttr(region)}${hasIssue ? ` ${icon("alertTriangle", 12)}` : ""}</div><div class="dsd-ui-region-metric__stats"><span>Renders: ${m.renderCount}</span><span>Updates: ${m.updateCount}</span><span>Errors: <span class="${m.errorCount > 0 ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${m.errorCount}</span></span><span>Avg: ${formatTime(m.avgRenderTime || 0)}</span></div></div>`;
    }).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("metrics")} Region Metrics</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn ${isEnabled ? "active" : ""}" id="btn-toggle-metrics">${icon(isEnabled ? "pause" : "play", 14)} ${isEnabled ? "Disable" : "Enable"}</button><button class="dsd-ui-btn" id="btn-reset-metrics">${icon("refresh", 14)} Reset</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Slowest</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${sanitizeAttr(summary.slowestRegion || "N/A")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Most Active</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${sanitizeAttr(summary.mostActiveRegion || "N/A")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Most Errors</div><div class="dsd-ui-card__value dsd-ui-card__value--sm ${summary.mostErrorsRegion ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${sanitizeAttr(summary.mostErrorsRegion || "None")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Problematic</div><div class="dsd-ui-card__value">${problematic.length}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("regions")} Per Region</div>${regionsHtml}</div>`;
  } catch (e) {
    return `<div class="dsd-ui-empty">Error rendering region metrics: ${sanitizeAttr(e.message)}</div>`;
  }
}
export {
  MODULE_ID,
  VERSION,
  renderRegionMetricsTab
};
