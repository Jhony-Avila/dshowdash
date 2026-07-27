const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.tabs.overview";
import { icon, sanitizeAttr, statusClass, getAppShell } from "../helpers.js";
import { renderHealthHistoryHtml } from "../health-tracker.js";
function renderOverviewTab() {
  const shell = getAppShell();
  if (!shell) {
    return '<div class="dsd-ui-empty">AppShell not available</div>';
  }
  try {
    const health = shell.healthCheck();
    const info = shell.info();
    let capsHtml = info.capabilities.slice(0, 20).map((c) => `<span class="dsd-ui-tag">${sanitizeAttr(c)}</span>`).join("");
    if (info.capabilities.length > 20) {
      capsHtml += `<span class="dsd-ui-tag">+${info.capabilities.length - 20} more</span>`;
    }
    const adaptersHtml = Object.keys(health.adapters || {}).map((name) => {
      const status = health.adapters[name];
      return `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${sanitizeAttr(name)}</span><span class="dsd-ui-list-item__value ${statusClass(status)}">${sanitizeAttr(status)}</span></div>`;
    }).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("activity")} App Shell Status</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Version</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${sanitizeAttr(info.version)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Health</div><div class="dsd-ui-card__value ${statusClass(health.status)}">${sanitizeAttr(health.status)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Score</div><div class="dsd-ui-card__value">${sanitizeAttr(health.score)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Phase</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${sanitizeAttr(info.phase)}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("state")} Capabilities (${info.capabilities.length})</div><div class="dsd-ui-tags">${capsHtml}</div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("api")} Adapters (${info.connectedAdapters.length})</div><div class="dsd-ui-list">${adaptersHtml}</div></div>${renderHealthHistoryHtml()}`;
  } catch (e) {
    return `<div class="dsd-ui-empty">Error rendering overview: ${sanitizeAttr(e.message)}</div>`;
  }
}
export {
  MODULE_ID,
  VERSION,
  renderOverviewTab
};
