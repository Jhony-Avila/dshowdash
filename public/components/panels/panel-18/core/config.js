const MODULE_ID = "panel-18/core/config";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MAX_CONSECUTIVE_ERRORS = 3;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 3e4;
const REQUEST_TIMEOUT = 1e4;
const DEFAULT_PERFORMANCE_METRICS = Object.freeze({ mountTime: 0, avgLoadTime: 0, successRate: 0, totalRequests: 0, failedRequests: 0 });
const ERROR_MESSAGES = Object.freeze({ "AUTH_REQUIRED": "Autentica\xE7\xE3o necess\xE1ria", "REQUEST_ABORTED": "Requisi\xE7\xE3o cancelada", "REQUEST_TIMEOUT": "Tempo esgotado", "NETWORK_ERROR": "Erro de rede", "HTTP_500": "Erro interno do servidor", "HTTP_404": "Endpoint n\xE3o encontrado", "CIRCUIT_BREAKER_OPEN": "Servi\xE7o temporariamente indispon\xEDvel" });
const getErrorMessage = (errorCode) => ERROR_MESSAGES[errorCode] || "Erro ao carregar dados";
const healthCheck = () => {
  const checks = { errorsConfigured: MAX_CONSECUTIVE_ERRORS > 0, circuitBreakerConfigured: CIRCUIT_BREAKER_THRESHOLD > 0, timeoutConfigured: REQUEST_TIMEOUT > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, timestamp: Date.now() };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, requestTimeout: REQUEST_TIMEOUT, circuitBreakerThreshold: CIRCUIT_BREAKER_THRESHOLD });
var config_default = { MODULE_ID, VERSION, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, REQUEST_TIMEOUT, DEFAULT_PERFORMANCE_METRICS, ERROR_MESSAGES, getErrorMessage, healthCheck, info };
export {
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT,
  DEFAULT_PERFORMANCE_METRICS,
  ERROR_MESSAGES,
  MAX_CONSECUTIVE_ERRORS,
  MODULE_ID,
  REQUEST_TIMEOUT,
  VERSION,
  config_default as default,
  getErrorMessage,
  healthCheck,
  info
};
