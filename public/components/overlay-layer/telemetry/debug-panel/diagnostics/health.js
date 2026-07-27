import { VERSION, MODULE_ID } from "../constants.js";
import { getConfig, getPanelElement, isVisible, getEventLog, getOverlayLayer } from "../state.js";
function healthCheck() {
  const config = getConfig();
  const panel = getPanelElement();
  const visible = isVisible();
  const eventLog = getEventLog();
  const overlayLayer = getOverlayLayer();
  const checks = {
    enabled: config.enabled,
    overlayLayerInjected: !!overlayLayer,
    panelCreated: !!panel || !visible
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  const total = keys.length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    visible,
    eventLogSize: eventLog.length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const config = getConfig();
  const eventLog = getEventLog();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: config.enabled,
    visible: isVisible(),
    collapsed: config.collapsed,
    position: config.position,
    hotkey: config.hotkey,
    eventLogSize: eventLog.length,
    timestamp: Date.now()
  };
}
var health_default = {
  healthCheck,
  info
};
export {
  health_default as default,
  healthCheck,
  info
};
