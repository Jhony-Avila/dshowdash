const PAINEL_ID = "panel-10";
const MODULE_ID = "panel-10.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_TITLE = "Financeiro";
const REFRESH_INTERVAL_BASE = 6e4;
const REFRESH_INTERVAL_DEGRADED = 18e4;
const REFRESH_INTERVAL_SLOW = 12e4;
const REFRESH_INTERVAL_FAST = 3e4;
const REFRESH_INTERVAL_SECONDS = 60;
const REQUEST_TIMEOUT = 1e4;
const MOUNT_TIMEOUT = 5e3;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 3e4;
const MAX_CONSECUTIVE_ERRORS = 3;
const CSS_PATH = "/components/panels/panel-10/styles/index.css";
const API_PATH = "/api/modules/panels/panel-10/api.php";
const THRESHOLDS = Object.freeze({
  CPU_WARNING: 70,
  CPU_CRITICAL: 90,
  RAM_WARNING: 75,
  RAM_CRITICAL: 90,
  DISK_WARNING: 80,
  DISK_CRITICAL: 95
});
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
const SERVER_STATUS = Object.freeze({
  ONLINE: "online",
  OFFLINE: "offline",
  DEGRADED: "degraded",
  UNKNOWN: "unknown"
});
const DEFAULT_PERFORMANCE_METRICS = Object.freeze({
  mountTime: 0,
  loadTime: 0,
  renderTime: 0,
  lastRefresh: null,
  totalRequests: 0,
  failedRequests: 0,
  avgLoadTime: 0,
  successRate: 100
});
var constants_default = {
  PAINEL_ID,
  MODULE_ID,
  VERSION,
  PANEL_TITLE,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  REFRESH_INTERVAL_SLOW,
  REFRESH_INTERVAL_FAST,
  REFRESH_INTERVAL_SECONDS,
  REQUEST_TIMEOUT,
  MOUNT_TIMEOUT,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT,
  MAX_CONSECUTIVE_ERRORS,
  CSS_PATH,
  API_PATH,
  THRESHOLDS,
  STATES,
  SERVER_STATUS,
  DEFAULT_PERFORMANCE_METRICS
};
function info() {
  return { moduleId: "panels-panel-10-core-constants", version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-10-core-constants", version: VERSION, checks: { constantsLoaded: true } };
}
export {
  API_PATH,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT,
  CSS_PATH,
  DEFAULT_PERFORMANCE_METRICS,
  MAX_CONSECUTIVE_ERRORS,
  MODULE_ID,
  MOUNT_TIMEOUT,
  PAINEL_ID,
  PANEL_TITLE,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  REFRESH_INTERVAL_FAST,
  REFRESH_INTERVAL_SECONDS,
  REFRESH_INTERVAL_SLOW,
  REQUEST_TIMEOUT,
  SERVER_STATUS,
  STATES,
  THRESHOLDS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
