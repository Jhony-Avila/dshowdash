import { getOverlayLayer, addEvent, clearEventLog as clearLog, isVisible } from "../state.js";
import { refresh } from "../ui/renderer.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.telemetry.debug-panel.actions.debug-actions";
function logEvent(type, data) {
  data = data || {};
  addEvent({
    type,
    id: data.id || null,
    action: data.action || null,
    timestamp: Date.now()
  });
  if (isVisible()) refresh();
}
function clearEventLog() {
  clearLog();
  if (isVisible()) refresh();
  return { ok: true };
}
function closeAll() {
  const overlayLayer = getOverlayLayer();
  if (overlayLayer && overlayLayer.closeAll) {
    overlayLayer.closeAll({ reason: "debug-panel" });
    logEvent("DEBUG_ACTION", { action: "closeAll" });
  }
}
function scanOrphans() {
  const overlayLayer = getOverlayLayer();
  if (overlayLayer && overlayLayer.scanOrphans) {
    const result = overlayLayer.scanOrphans();
    const orphanCount = result && result.orphans && result.orphans.length || 0;
    logEvent("DEBUG_ACTION", { action: "scanOrphans", orphans: orphanCount });
    if (orphanCount > 0) {
      console.log("[OverlayDebug] Orphans found:", result.orphans);
    }
  }
}
function exportInfo() {
  const overlayLayer = getOverlayLayer();
  if (overlayLayer && overlayLayer.info) {
    const info = overlayLayer.info();
    console.log("[OverlayDebug] Full Info:", JSON.stringify(info, null, 2));
    logEvent("DEBUG_ACTION", { action: "exportInfo" });
  }
}
var debug_actions_default = {
  logEvent,
  clearEventLog,
  closeAll,
  scanOrphans,
  exportInfo
};
export {
  MODULE_ID,
  VERSION,
  clearEventLog,
  closeAll,
  debug_actions_default as default,
  exportInfo,
  logEvent,
  scanOrphans
};
