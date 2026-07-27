const MODULE_ID = "panel-07.core.config";
const VERSION = "9.3.0-P2-ENTERPRISE";
const CONFIG = {
  panelId: "panel-07",
  apiEndpoint: "/api/v1/panel-07",
  refreshInterval: 3e4,
  maxItems: 100,
  defaultPageSize: 20,
  features: {
    autoRefresh: true,
    export: true,
    filtering: true,
    sorting: true
  }
};
function getConfig(key) {
  return key ? CONFIG[key] : CONFIG;
}
var config_default = CONFIG;
const MAX_CONSECUTIVE_ERRORS = 5;
const REQUEST_TIMEOUT = 1e4;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 6e4;
const DEFAULT_PERFORMANCE_METRICS = {
  requestCount: 0,
  errorCount: 0,
  consecutiveErrors: 0,
  avgResponseTime: 0,
  lastRequestTime: 0,
  circuitBreakerTrips: 0
};
function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}
export {
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT,
  CONFIG,
  DEFAULT_PERFORMANCE_METRICS,
  MAX_CONSECUTIVE_ERRORS,
  MODULE_ID,
  REQUEST_TIMEOUT,
  VERSION,
  config_default as default,
  getConfig,
  getErrorMessage
};
