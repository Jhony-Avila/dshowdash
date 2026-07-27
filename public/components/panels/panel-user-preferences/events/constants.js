const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences-events";
const AUTO_SAVE_DELAY = 3e3;
const MAX_UNDO = 10;
var constants_default = { VERSION, MODULE_ID, AUTO_SAVE_DELAY, MAX_UNDO };
function info() {
  return { moduleId: "panels-panel-user-preferences-events-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-user-preferences-events-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  AUTO_SAVE_DELAY,
  MAX_UNDO,
  MODULE_ID,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
