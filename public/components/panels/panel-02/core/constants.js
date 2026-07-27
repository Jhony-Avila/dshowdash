const PAINEL_ID = "panel-02";
const MODULE_ID = "panel-02.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const REFRESH_INTERVAL_BASE = 6e4;
const REFRESH_INTERVAL_DEGRADED = 18e4;
const CSS_FILES = [
  "/components/panels/panel-02/styles/index.css"
];
function info() {
  return { moduleId: "panels-panel-02-core-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-02-core-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  CSS_FILES,
  MODULE_ID,
  PAINEL_ID,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  VERSION,
  healthCheck,
  info
};
