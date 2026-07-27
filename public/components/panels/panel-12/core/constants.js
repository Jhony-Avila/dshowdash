const PANEL_ID = "painel-12";
const MODULE_ID = "panel-12.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const REFRESH_INTERVAL_BASE = 3e4;
const REFRESH_INTERVAL_DEGRADED = 12e4;
const SEARCH_DEBOUNCE_MS = 300;
const CSS_PATH = "/components/panels/panel-12/styles/index.css";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } };
}
export {
  CSS_PATH,
  MODULE_ID,
  PANEL_ID,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  SEARCH_DEBOUNCE_MS,
  VERSION,
  healthCheck,
  info
};
