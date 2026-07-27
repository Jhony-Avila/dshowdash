const PAINEL_ID = "panel-08";
const MODULE_ID = "panel-08.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_NAME = "Alertas do Sistema";
const REFRESH_INTERVAL_BASE = 6e4;
const REFRESH_INTERVAL_DEGRADED = 18e4;
const CSS_PATH = "/components/panels/panel-08/styles/index.css";
const STATES = Object.freeze({
  IDLE: "IDLE",
  MOUNTING: "MOUNTING",
  MOUNTED: "MOUNTED",
  LOADING: "LOADING",
  READY: "READY",
  ERROR: "ERROR",
  DEGRADED: "DEGRADED",
  UNMOUNTING: "UNMOUNTING",
  DESTROYED: "DESTROYED"
});
const CONFIG = Object.freeze({
  MAX_CONSECUTIVE_ERRORS: 3,
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_TIMEOUT: 3e4,
  REQUEST_TIMEOUT: 1e4,
  MAX_ALERTS_DISPLAY: 10
});
var constants_default = {
  PAINEL_ID,
  MODULE_ID,
  VERSION,
  PANEL_NAME,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  CSS_PATH,
  STATES,
  CONFIG
};
function info() {
  return { moduleId: "panels-panel-08-core-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-08-core-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  CONFIG,
  CSS_PATH,
  MODULE_ID,
  PAINEL_ID,
  PANEL_NAME,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  STATES,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
