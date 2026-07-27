const PANEL_ID = "panel-feature-flags-admin";
const MODULE_ID = "panel-feature-flags-admin.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const API_BASE = "/api/feature-flags";
const REFRESH_INTERVAL = 30;
const REFRESH_INTERVAL_DEGRADED = 90;
const CSS_FILES = [
  "/components/panels/panel-feature-flags-admin/styles/index.css"
];
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } };
}
export {
  API_BASE,
  CSS_FILES,
  MODULE_ID,
  PANEL_ID,
  REFRESH_INTERVAL,
  REFRESH_INTERVAL_DEGRADED,
  VERSION,
  healthCheck,
  info
};
