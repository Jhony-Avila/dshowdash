import { AUTH_ERROR_CODES, RETRYABLE_STATUS_CODES, DEFAULT_MESSAGES, STATUS_TO_ERROR_MAP } from "./constants.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
const MODULE_ID = "login-modal-api-helpers";
const VERSION = "5.6.0-P18EC";
function buildHeaders(traceId, csrfManager, deviceIDManager) {
  const headers = { "Content-Type": "application/json", "Accept": "application/json", "X-Requested-With": "XMLHttpRequest", "X-Trace-Id": traceId };
  if (csrfManager) {
    Object.assign(headers, csrfManager.getHeaders());
  }
  if (deviceIDManager) {
    headers["X-Device-Id"] = deviceIDManager.get();
  }
  return headers;
}
function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text().then((text) => ({
    ok: false,
    error: `Resposta n\xE3o-JSON (${response.status})`,
    message: text.slice(0, 100)
  }));
}
function mapStatusToErrorCode(status) {
  return STATUS_TO_ERROR_MAP[status] || AUTH_ERROR_CODES.UNKNOWN_ERROR;
}
function shouldRetry(status, attempt, maxAttempts) {
  return RETRYABLE_STATUS_CODES.has(status) && attempt < maxAttempts;
}
function shouldRetryNetworkError(error, attempt, maxAttempts) {
  return error.name === "TypeError" && attempt < maxAttempts;
}
function calculateBackoff(attempt) {
  return Math.min(1e3 * Math.pow(2, attempt - 1), 5e3);
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
function combineSignals(external, internal) {
  if (!external) return internal;
  const controller = new AbortController();
  external.addEventListener("abort", () => {
    controller.abort();
  }, { once: true });
  internal.addEventListener("abort", () => {
    controller.abort();
  }, { once: true });
  return controller.signal;
}
function generateTraceId() {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function getDefaultMessage(errorCode) {
  return DEFAULT_MESSAGES[errorCode] || "Erro desconhecido";
}
function emitTelemetry(telemetry, method, event, data) {
  if (!telemetry) return;
  try {
    const eventKey = AUTH_EVENTS[`${method.toUpperCase()}_${event.toUpperCase()}`] || `auth.${method}.${event}`;
    telemetry.track(eventKey, Object.assign({ method, event, timestamp: Date.now() }, data || {}));
  } catch (e) {
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function healthCheck() {
  const checks = { moduleLoaded: true, buildHeadersAvailable: typeof buildHeaders === "function", parseResponseAvailable: typeof parseResponse === "function" };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
export {
  MODULE_ID,
  VERSION,
  buildHeaders,
  calculateBackoff,
  combineSignals,
  emitTelemetry,
  generateTraceId,
  getDefaultMessage,
  healthCheck,
  info,
  mapStatusToErrorCode,
  parseResponse,
  shouldRetry,
  shouldRetryNetworkError,
  sleep
};
