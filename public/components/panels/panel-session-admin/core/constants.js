const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-session-admin-core-constants";
const AUTO_REFRESH_SECONDS = 30;
const DEFAULT_HIDDEN_COLS = /* @__PURE__ */ new Set(["expires", "created"]);
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } };
}
var constants_default = { VERSION, MODULE_ID, AUTO_REFRESH_SECONDS, DEFAULT_HIDDEN_COLS, info, healthCheck };
export {
  AUTO_REFRESH_SECONDS,
  DEFAULT_HIDDEN_COLS,
  MODULE_ID,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
