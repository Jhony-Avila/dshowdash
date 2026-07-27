const PAINEL_ID = "panel-06";
const MODULE_ID = "panel-06";
const VERSION = "9.3.0-P2-ENTERPRISE";
const REFRESH_INTERVAL_BASE = 6e4;
const REFRESH_INTERVAL_DEGRADED = 18e4;
const CSS_PATH = "/components/panels/panel-06/styles/index.css";
function info() {
  return { moduleId: "panels-panel-06-core-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-06-core-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  CSS_PATH,
  MODULE_ID,
  PAINEL_ID,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  VERSION,
  healthCheck,
  info
};
