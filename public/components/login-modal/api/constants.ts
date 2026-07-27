// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.6.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-api-constants
// PURPOSE: Login Modal - Auth Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   AUTH_ERROR_CODES — exported value
//   RETRYABLE_STATUS_CODES — exported value
//   createResponse() — exported function
//   DEFAULT_MESSAGES — exported value
//   STATUS_TO_ERROR_MAP — exported value
//   info() — exported function
//   healthCheck() — exported function
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

export const MODULE_ID = 'login-modal-api-constants';
export const VERSION = '5.6.0-ENTERPRISE';

export const AUTH_ERROR_CODES = { NETWORK_ERROR: 'NETWORK_ERROR', REQUEST_TIMEOUT: 'REQUEST_TIMEOUT', REQUEST_ABORTED: 'REQUEST_ABORTED', INVALID_CREDENTIALS: 'INVALID_CREDENTIALS', UNAUTHORIZED: 'UNAUTHORIZED', FORBIDDEN: 'FORBIDDEN', NOT_FOUND: 'NOT_FOUND', RATE_LIMITED: 'RATE_LIMITED', VALIDATION_ERROR: 'VALIDATION_ERROR', SERVER_ERROR: 'SERVER_ERROR', BAD_GATEWAY: 'BAD_GATEWAY', SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE', GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT', MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED', INVALID_RESPONSE: 'INVALID_RESPONSE', INVALID_CONFIG: 'INVALID_CONFIG', UNKNOWN_ERROR: 'UNKNOWN_ERROR' };
export const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);
export const createResponse = (success: boolean, data: Record<string, any> = {}) => ({ ok: success, success, status: data.status || null, code: data.code || (success ? 'SUCCESS' : AUTH_ERROR_CODES.UNKNOWN_ERROR), message: data.message || '', data: data.data || null, retryAfter: data.retryAfter || data.data?.retryAfter || null, latency: data.latency || 0, traceId: data.traceId || null, timestamp: Date.now(), error: data.error || null });
export const DEFAULT_MESSAGES = { [AUTH_ERROR_CODES.REQUEST_TIMEOUT]: 'Tempo esgotado', [AUTH_ERROR_CODES.REQUEST_ABORTED]: 'Requisição cancelada', [AUTH_ERROR_CODES.NETWORK_ERROR]: 'Erro de conexão', [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 'Credenciais inválidas', [AUTH_ERROR_CODES.RATE_LIMITED]: 'Muitas tentativas', [AUTH_ERROR_CODES.SERVER_ERROR]: 'Erro no servidor', [AUTH_ERROR_CODES.SERVICE_UNAVAILABLE]: 'Serviço indisponível', [AUTH_ERROR_CODES.MAX_RETRIES_EXCEEDED]: 'Máximo de tentativas atingido', [AUTH_ERROR_CODES.INVALID_CONFIG]: 'Configuração inválida' };
export const STATUS_TO_ERROR_MAP = { 400: AUTH_ERROR_CODES.VALIDATION_ERROR, 401: AUTH_ERROR_CODES.INVALID_CREDENTIALS, 403: AUTH_ERROR_CODES.FORBIDDEN, 404: AUTH_ERROR_CODES.NOT_FOUND, 429: AUTH_ERROR_CODES.RATE_LIMITED, 500: AUTH_ERROR_CODES.SERVER_ERROR, 502: AUTH_ERROR_CODES.BAD_GATEWAY, 503: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE, 504: AUTH_ERROR_CODES.GATEWAY_TIMEOUT };
export function info() { return { moduleId: MODULE_ID, version: VERSION, errorCodesCount: Object.keys(AUTH_ERROR_CODES).length, timestamp: Date.now() }; }
export function healthCheck() { const checks = { moduleLoaded: true, errorCodesAvailable: Object.keys(AUTH_ERROR_CODES).length > 0, createResponseAvailable: typeof createResponse === 'function' }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
