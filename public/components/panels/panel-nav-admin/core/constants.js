const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_ID = "panel-nav-admin";
const MODULE_ID = "panel-nav-admin.core.constants";
const PANEL_TITLE = "Administra\xE7\xE3o de Navega\xE7\xE3o";
const PANEL_DESCRIPTION = "Gerencie itens e se\xE7\xF5es da sidebar";
const API_PATH = "/api/admin/navigation/index.php";
const API_VALIDATE_PATH = "/api/admin/navigation/validate.php";
const CSS_PATH = "/components/panels/panel-nav-admin/styles.css";
const REFRESH_INTERVAL = 12e4;
const REQUEST_TIMEOUT = 15e3;
const DEBOUNCE_DELAY = 300;
const ITEMS_PER_PAGE = 9999;
const STATES = {
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  SAVING: "saving",
  ERROR: "error",
  DETAIL: "detail"
};
const EXPORT_FORMATS = ["json", "csv"];
const SHORTCUTS = {
  REFRESH: "r",
  NEW_ITEM: "n",
  SEARCH: "/",
  ESCAPE: "Escape",
  SAVE: "ctrl+s"
};
const TABS = {
  ITEMS: "items",
  SECTIONS: "sections",
  DIAGNOSTIC: "diagnostic"
};
const HEALTH_THRESHOLDS = {
  HEALTHY: 90,
  GOOD: 75,
  DEGRADED: 50,
  WARNING: 25
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } };
}
var constants_default = {
  PANEL_ID,
  MODULE_ID,
  VERSION,
  PANEL_TITLE,
  PANEL_DESCRIPTION,
  API_PATH,
  API_VALIDATE_PATH,
  CSS_PATH,
  REFRESH_INTERVAL,
  REQUEST_TIMEOUT,
  DEBOUNCE_DELAY,
  ITEMS_PER_PAGE,
  STATES,
  EXPORT_FORMATS,
  SHORTCUTS,
  TABS,
  HEALTH_THRESHOLDS,
  info,
  healthCheck
};
export {
  API_PATH,
  API_VALIDATE_PATH,
  CSS_PATH,
  DEBOUNCE_DELAY,
  EXPORT_FORMATS,
  HEALTH_THRESHOLDS,
  ITEMS_PER_PAGE,
  MODULE_ID,
  PANEL_DESCRIPTION,
  PANEL_ID,
  PANEL_TITLE,
  REFRESH_INTERVAL,
  REQUEST_TIMEOUT,
  SHORTCUTS,
  STATES,
  TABS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
