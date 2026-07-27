const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-08.core.contracts";
const PANEL_NAME = "Alertas do Sistema";
const STATES = Object.freeze({ IDLE: "IDLE", MOUNTING: "MOUNTING", MOUNTED: "MOUNTED", LOADING: "LOADING", READY: "READY", ERROR: "ERROR", DEGRADED: "DEGRADED", UNMOUNTING: "UNMOUNTING", DESTROYED: "DESTROYED" });
const LOCAL_EVENTS = Object.freeze({ MOUNT_START: "panel-08:mount:start", MOUNT_SUCCESS: "panel-08:mount:success", MOUNT_ERROR: "panel-08:mount:error", UNMOUNT: "panel-08:unmount", REFRESH_START: "panel-08:refresh:start", REFRESH_SUCCESS: "panel-08:refresh:success", REFRESH_ERROR: "panel-08:refresh:error", DATA_UPDATED: "panel-08:data:updated", ALERT_ACKNOWLEDGED: "panel-08:alert:acknowledged" });
const ALERT_TYPES = Object.freeze({ ERROR: "ERROR", WARNING: "WARNING", INFO: "INFO", SUCCESS: "SUCCESS" });
const SEVERITIES = Object.freeze({ CRITICAL: "critical", HIGH: "high", MEDIUM: "medium", LOW: "low" });
const CONFIG = Object.freeze({ REFRESH_INTERVAL: 6e4, REFRESH_INTERVAL_DEGRADED: 18e4, REQUEST_TIMEOUT: 1e4, MAX_CONSECUTIVE_ERRORS: 3, CIRCUIT_BREAKER_THRESHOLD: 5, CIRCUIT_BREAKER_TIMEOUT: 3e4, MAX_ALERTS_DISPLAY: 15, AUTO_REFRESH_DEFAULT: true });
const CSS_PREFIX = "p08";
const isValidAlert = (alert) => alert && typeof alert === "object" && alert.id;
const isValidAlertType = (type) => Object.values(ALERT_TYPES).includes(type);
const isValidSeverity = (severity) => severity && Object.values(SEVERITIES).includes(severity.toLowerCase());
const info = () => ({ moduleId: MODULE_ID, version: VERSION, panelName: PANEL_NAME });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { statesCount: Object.keys(STATES).length, alertTypesCount: Object.keys(ALERT_TYPES).length } });
export {
  ALERT_TYPES,
  CONFIG,
  CSS_PREFIX,
  LOCAL_EVENTS,
  MODULE_ID,
  PANEL_NAME,
  SEVERITIES,
  STATES,
  VERSION,
  healthCheck,
  info,
  isValidAlert,
  isValidAlertType,
  isValidSeverity
};
