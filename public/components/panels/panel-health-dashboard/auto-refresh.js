import { PANEL_INTENTS } from "/core/runtime/events/catalog/panels.events.js";
import { REFRESH_INTERVAL } from "./core/config.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-health-dashboard:auto-refresh";
function startAutoRefresh(panel) {
  stopAutoRefresh(panel);
  panel.countdownValue = REFRESH_INTERVAL / 1e3;
  panel.countdownInterval = setInterval(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    panel.countdownValue--;
    panel._updateCountdownDisplay();
    if (panel.countdownValue <= 0) {
      panel.countdownValue = REFRESH_INTERVAL / 1e3;
      panel.refresh();
    }
  }, 1e3);
}
function stopAutoRefresh(panel) {
  if (panel.countdownInterval) {
    clearInterval(panel.countdownInterval);
    panel.countdownInterval = null;
  }
}
function setupEventListeners(panel) {
  if (!panel._abortController) {
    panel._abortController = new AbortController();
  }
  document.addEventListener("visibilitychange", panel._handleVisibilityChange, { signal: panel._abortController.signal });
  if (panel.eventBus && panel.eventBus.on) {
    panel.eventBus.on(PANEL_INTENTS.REFRESH, panel._handleRefreshEvent);
  }
}
function cleanupEventListeners(panel) {
  if (panel._abortController) {
    panel._abortController.abort();
    panel._abortController = null;
  }
  if (panel.eventBus && panel.eventBus.off) {
    panel.eventBus.off(PANEL_INTENTS.REFRESH, panel._handleRefreshEvent);
  }
  for (let i = 0; i < panel.unsubscribers.length; i++) {
    if (panel.unsubscribers[i]) panel.unsubscribers[i]();
  }
  panel.unsubscribers = [];
}
function updatePerformanceMetrics(panel, loadTime, success) {
  const m = panel.performanceMetrics;
  m.totalRequests++;
  if (!success) m.failedRequests++;
  if (success && loadTime > 0) {
    m.avgLoadTime = Math.round((m.avgLoadTime * (m.totalRequests - 1) + loadTime) / m.totalRequests);
  }
  m.successRate = Math.round((m.totalRequests - m.failedRequests) / m.totalRequests * 100);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var auto_refresh_default = { startAutoRefresh, stopAutoRefresh, setupEventListeners, cleanupEventListeners, updatePerformanceMetrics };
export {
  MODULE_ID,
  VERSION,
  cleanupEventListeners,
  auto_refresh_default as default,
  info,
  setupEventListeners,
  startAutoRefresh,
  stopAutoRefresh,
  updatePerformanceMetrics
};
