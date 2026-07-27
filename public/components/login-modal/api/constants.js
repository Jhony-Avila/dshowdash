const MODULE_ID = "login-modal-api-constants";
const VERSION = "5.6.0-ENTERPRISE";
const AUTH_ERROR_CODES = { NETWORK_ERROR: "NETWORK_ERROR", REQUEST_TIMEOUT: "REQUEST_TIMEOUT", REQUEST_ABORTED: "REQUEST_ABORTED", INVALID_CREDENTIALS: "INVALID_CREDENTIALS", UNAUTHORIZED: "UNAUTHORIZED", FORBIDDEN: "FORBIDDEN", NOT_FOUND: "NOT_FOUND", RATE_LIMITED: "RATE_LIMITED", VALIDATION_ERROR: "VALIDATION_ERROR", SERVER_ERROR: "SERVER_ERROR", BAD_GATEWAY: "BAD_GATEWAY", SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE", GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT", MAX_RETRIES_EXCEEDED: "MAX_RETRIES_EXCEEDED", INVALID_RESPONSE: "INVALID_RESPONSE", INVALID_CONFIG: "INVALID_CONFIG", UNKNOWN_ERROR: "UNKNOWN_ERROR" };
const RETRYABLE_STATUS_CODES = /* @__PURE__ */ new Set([500, 502, 503, 504]);
const createResponse = (success, data = {}) => ({ ok: success, success, status: data.status || null, code: data.code || (success ? "SUCCESS" : AUTH_ERROR_CODES.UNKNOWN_ERROR), message: data.message || "", data: data.data || null, retryAfter: data.retryAfter || data.data?.retryAfter || null, latency: data.latency || 0, traceId: data.traceId || null, timestamp: Date.now(), error: data.error || null });
const DEFAULT_MESSAGES = { [AUTH_ERROR_CODES.REQUEST_TIMEOUT]: "Tempo esgotado", [AUTH_ERROR_CODES.REQUEST_ABORTED]: "Requisi\xE7\xE3o cancelada", [AUTH_ERROR_CODES.NETWORK_ERROR]: "Erro de conex\xE3o", [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: "Credenciais inv\xE1lidas", [AUTH_ERROR_CODES.RATE_LIMITED]: "Muitas tentativas", [AUTH_ERROR_CODES.SERVER_ERROR]: "Erro no servidor", [AUTH_ERROR_CODES.SERVICE_UNAVAILABLE]: "Servi\xE7o indispon\xEDvel", [AUTH_ERROR_CODES.MAX_RETRIES_EXCEEDED]: "M\xE1ximo de tentativas atingido", [AUTH_ERROR_CODES.INVALID_CONFIG]: "Configura\xE7\xE3o inv\xE1lida" };
const STATUS_TO_ERROR_MAP = { 400: AUTH_ERROR_CODES.VALIDATION_ERROR, 401: AUTH_ERROR_CODES.INVALID_CREDENTIALS, 403: AUTH_ERROR_CODES.FORBIDDEN, 404: AUTH_ERROR_CODES.NOT_FOUND, 429: AUTH_ERROR_CODES.RATE_LIMITED, 500: AUTH_ERROR_CODES.SERVER_ERROR, 502: AUTH_ERROR_CODES.BAD_GATEWAY, 503: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE, 504: AUTH_ERROR_CODES.GATEWAY_TIMEOUT };
function info() {
  return { moduleId: MODULE_ID, version: VERSION, errorCodesCount: Object.keys(AUTH_ERROR_CODES).length, timestamp: Date.now() };
}
function healthCheck() {
  const checks = { moduleLoaded: true, errorCodesAvailable: Object.keys(AUTH_ERROR_CODES).length > 0, createResponseAvailable: typeof createResponse === "function" };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
export {
  AUTH_ERROR_CODES,
  DEFAULT_MESSAGES,
  MODULE_ID,
  RETRYABLE_STATUS_CODES,
  STATUS_TO_ERROR_MAP,
  VERSION,
  createResponse,
  healthCheck,
  info
};
