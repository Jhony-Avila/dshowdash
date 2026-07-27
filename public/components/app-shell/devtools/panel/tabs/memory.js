import { icon, sanitizeAttr, formatBytes, getAppShell } from "../helpers.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.tabs.memory";
function renderMemoryTab() {
  const shell = getAppShell();
  if (!shell || !shell.memoryLeaks) {
    return '<div class="dsd-ui-empty">MemoryLeakDetector not available</div>';
  }
  try {
    const info = shell.memoryLeaks.info();
    const lastReport = shell.memoryLeaks.getLastReport();
    const isEnabled = shell.memoryLeaks.isEnabled();
    const perf = typeof performance !== "undefined" ? performance : null;
    const memory = perf && perf.memory ? perf.memory : null;
    const memoryUsageHtml = memory ? `<div class="dsd-ui-memory-bar"><div class="dsd-ui-memory-bar__fill" style="width:${Math.round(memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100)}%"></div></div><div class="dsd-ui-memory-labels"><span>Used: ${formatBytes(memory.usedJSHeapSize)}</span><span>Limit: ${formatBytes(memory.jsHeapSizeLimit)}</span></div>` : '<div class="dsd-ui-empty">Memory API not available</div>';
    const leaksHtml = lastReport && lastReport.potentialLeaks && lastReport.potentialLeaks.length > 0 ? `<div class="dsd-ui-list">${lastReport.potentialLeaks.slice(0, 5).map((leak) => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label dsd-ui-status--degraded">${sanitizeAttr(leak.type)}</span><span class="dsd-ui-list-item__value">${leak.count}</span></div>`).join("")}</div>` : '<div class="dsd-ui-empty">No potential leaks detected</div>';
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("memory")} Memory Analysis</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn ${isEnabled ? "active" : ""}" id="btn-toggle-memory">${icon(isEnabled ? "pause" : "play", 14)} ${isEnabled ? "Disable" : "Enable"}</button><button class="dsd-ui-btn" id="btn-check-memory">${icon("search", 14)} Check</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Listeners</div><div class="dsd-ui-card__value">${info.trackedListeners}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Intervals</div><div class="dsd-ui-card__value">${info.trackedIntervals}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Timeouts</div><div class="dsd-ui-card__value">${info.trackedTimeouts}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Reports</div><div class="dsd-ui-card__value">${info.metrics.checksPerformed}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("metrics")} Memory Usage</div>${memoryUsageHtml}</div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("alertTriangle")} Potential Leaks</div>${leaksHtml}</div>`;
  } catch (e) {
    return `<div class="dsd-ui-empty">Error rendering memory: ${sanitizeAttr(e.message)}</div>`;
  }
}
export {
  MODULE_ID,
  VERSION,
  renderMemoryTab
};
