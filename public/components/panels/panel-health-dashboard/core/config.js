const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-health-dashboard/core/config";
const MAX_CONSECUTIVE_ERRORS = 3;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 3e4;
const REQUEST_TIMEOUT = 15e3;
const REFRESH_INTERVAL = 3e4;
const REFRESH_INTERVAL_DEGRADED = 9e4;
const DEFAULT_PERFORMANCE_METRICS = Object.freeze({ mountTime: 0, avgLoadTime: 0, successRate: 0, totalRequests: 0, failedRequests: 0 });
const HEALTH_THRESHOLDS = Object.freeze({ HEALTHY: 80, DEGRADED: 50, UNHEALTHY: 0 });
const ERROR_MESSAGES = Object.freeze({ "REQUEST_ABORTED": "Requisi\xE7\xE3o cancelada", "NETWORK_ERROR": "Erro de rede", "CIRCUIT_BREAKER_OPEN": "Servi\xE7o temporariamente indispon\xEDvel" });
function getErrorMessage(errorCode) {
  return ERROR_MESSAGES[errorCode] || "Erro ao coletar dados";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var config_default = { VERSION, MODULE_ID, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, REQUEST_TIMEOUT, REFRESH_INTERVAL, DEFAULT_PERFORMANCE_METRICS, HEALTH_THRESHOLDS, ERROR_MESSAGES, getErrorMessage, info, healthCheck };
export {
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT,
  DEFAULT_PERFORMANCE_METRICS,
  ERROR_MESSAGES,
  HEALTH_THRESHOLDS,
  MAX_CONSECUTIVE_ERRORS,
  MODULE_ID,
  REFRESH_INTERVAL,
  REFRESH_INTERVAL_DEGRADED,
  REQUEST_TIMEOUT,
  VERSION,
  config_default as default,
  getErrorMessage,
  healthCheck,
  info
};
