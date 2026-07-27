import { UARPS_REGION } from "./constants.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-main:uarps";
function applyUarpsRegion(element) {
  if (element && !element.hasAttribute("data-uarps-region")) {
    element.setAttribute("data-uarps-region", UARPS_REGION);
  }
}
function hasUarpsRegion(element) {
  return element?.hasAttribute("data-uarps-region") || false;
}
function getUarpsRegion(element) {
  return element?.getAttribute("data-uarps-region") || null;
}
function healthCheck() {
  const checks = { uarpsRegionDefined: !!UARPS_REGION, helperReady: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, uarpsRegion: UARPS_REGION, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, uarpsRegion: UARPS_REGION };
}
export {
  MODULE_ID,
  VERSION,
  applyUarpsRegion,
  getUarpsRegion,
  hasUarpsRegion,
  healthCheck,
  info
};
