import { MODULE_ID } from "../core/constants.js";
function trackEvent(action, data) {
  try {
    if (window.Core?.EventBus?.emit) {
      window.Core.EventBus.emit("telemetry:event", {
        module: MODULE_ID,
        action,
        timestamp: Date.now(),
        ...data
      });
    }
  } catch (_) {
  }
}
function trackMount() {
  trackEvent("mount");
}
function trackUnmount() {
  trackEvent("unmount");
}
function trackFilterChange(filters) {
  trackEvent("filter-change", filters);
}
function trackScreenshotRequest(panelId) {
  trackEvent("screenshot-request", { panelId });
}
function trackToggleActive(panelId, newState) {
  trackEvent("toggle-active", { panelId, newState });
}
function trackSavePanel(panelId) {
  trackEvent("save-panel", { panelId });
}
export {
  trackEvent,
  trackFilterChange,
  trackMount,
  trackSavePanel,
  trackScreenshotRequest,
  trackToggleActive,
  trackUnmount
};
