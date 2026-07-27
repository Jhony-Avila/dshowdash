// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.6.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-api-helpers
// PURPOSE: Login Modal - Auth Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   AUTH_ERROR_CODES, RETRYABLE_STATUS_CODES, DEFAULT_MESSAGES, STATUS_TO_ERROR_MAP from ./constants.js
//   AUTH_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   buildHeaders() — exported function
//   parseResponse() — exported function
//   mapStatusToErrorCode() — exported function
//   shouldRetry() — exported function
//   shouldRetryNetworkError() — exported function
//   calculateBackoff() — exported function
//   sleep() — exported function
//   combineSignals() — exported function
//   generateTraceId() — exported function
//   getDefaultMessage() — exported function
//   emitTelemetry() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { AUTH_ERROR_CODES, RETRYABLE_STATUS_CODES, DEFAULT_MESSAGES, STATUS_TO_ERROR_MAP } from './constants.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';

const MODULE_ID = 'login-modal-api-helpers';
const VERSION = '5.6.0-P18EC';

export function buildHeaders(traceId: string, csrfManager: any, deviceIDManager: any) { const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-Trace-Id': traceId }; if (csrfManager) { Object.assign(headers, csrfManager.getHeaders()); } if (deviceIDManager) { headers['X-Device-Id'] = deviceIDManager.get(); } return headers; }
export function parseResponse(response: Response) { const contentType = response.headers.get('content-type') || ''; if (contentType.includes('application/json')) { return response.json(); } return response.text().then(text => ({
  ok: false,
  error: `Resposta não-JSON (${response.status})`,
  message: text.slice(0, 100)
})); }
export function mapStatusToErrorCode(status: number) { return (STATUS_TO_ERROR_MAP as Record<number, string>)[status] || AUTH_ERROR_CODES.UNKNOWN_ERROR; }
export function shouldRetry(status: number, attempt: number, maxAttempts: number) { return RETRYABLE_STATUS_CODES.has(status) && attempt < maxAttempts; }
export function shouldRetryNetworkError(error: any, attempt: number, maxAttempts: number) { return error.name === 'TypeError' && attempt < maxAttempts; }
export function calculateBackoff(attempt: number) { return Math.min(1000 * Math.pow(2, attempt - 1), 5000); }
export function sleep(ms: number) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
export function combineSignals(external: AbortSignal | null, internal: AbortSignal) { if (!external) return internal; const controller = new AbortController(); external.addEventListener('abort', () => { controller.abort(); }, { once: true }); internal.addEventListener('abort', () => { controller.abort(); }, { once: true }); return controller.signal; }
export function generateTraceId() { return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; }
export function getDefaultMessage(errorCode: string) { return DEFAULT_MESSAGES[errorCode] || 'Erro desconhecido'; }
export function emitTelemetry(telemetry: any, method: string, event: string, data: Record<string, unknown>) { if (!telemetry) return; try { const eventKey = (AUTH_EVENTS as Record<string, string>)[`${method.toUpperCase()}_${event.toUpperCase()}`] || (`auth.${method}.${event}`); telemetry.track(eventKey, Object.assign({ method, event, timestamp: Date.now() }, data || {})); } catch (e) {} }
export function info() { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function healthCheck() { const checks = { moduleLoaded: true, buildHeadersAvailable: typeof buildHeaders === 'function', parseResponseAvailable: typeof parseResponse === 'function' }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export { VERSION, MODULE_ID };
