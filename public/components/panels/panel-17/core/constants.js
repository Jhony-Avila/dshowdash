const PAINEL_ID = "panel-17";
const MODULE_ID = "panel-17.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_TITLE = "Or\xE7amento Clientes";
const REFRESH_INTERVAL_BASE = 6e4;
const REFRESH_INTERVAL_DEGRADED = 18e4;
const CSS_FILES = [
  "/components/panels/panel-17/styles/index.css"
];
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 3e4;
const REQUEST_TIMEOUT = 1e4;
const MAX_CONSECUTIVE_ERRORS = 3;
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
function info() {
  return { moduleId: "panels-panel-17-core-constants", version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-17-core-constants", version: VERSION, checks: { constantsLoaded: true } };
}
export {
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT,
  CSS_FILES,
  MAX_CONSECUTIVE_ERRORS,
  MODULE_ID,
  PAINEL_ID,
  PANEL_TITLE,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  REQUEST_TIMEOUT,
  STATES,
  VERSION,
  healthCheck,
  info
};
