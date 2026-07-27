const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail-controller";
const AUTO_REFRESH_SECONDS = 30;
const PRESET_DAYS = {
  "LAST_15_MIN": 1,
  "LAST_HOUR": 1,
  "LAST_24H": 1,
  "TODAY": 1,
  "LAST_7_DAYS": 7,
  "LAST_30_DAYS": 30,
  "LAST_90_DAYS": 90
};
var constants_default = { VERSION, MODULE_ID, AUTO_REFRESH_SECONDS, PRESET_DAYS };
function info() {
  return { moduleId: "panels-panel-audit-trail-core-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-audit-trail-core-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  AUTO_REFRESH_SECONDS,
  MODULE_ID,
  PRESET_DAYS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
