// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: api-client
// PURPOSE: API Client - Configuration v3.2.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MODULE_VERSION — exported value
//   DEFAULT_CONFIG — exported value
//   REQUEST_PROFILES — exported value
//   RETRYABLE_STATUS_CODES — exported value
//   AUTH_ERROR_STATUS_CODES — exported value
//   ERROR_CODES — exported value
//   HTTP_STATUS_MESSAGES — exported value
//   RESPONSE_SHAPE — exported value
//   TELEMETRY_ENDPOINT — exported value
//   getVersion() — exported function
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

export var VERSION = '3.2.0-ENTERPRISE';
export var MODULE_ID = 'api-client';
export var MODULE_VERSION = VERSION;

export var DEFAULT_CONFIG = Object.freeze({ baseURL: '', timeout: 10000, retries: 2, retryDelay: 1000, backoffMultiplier: 2, maxRetryDelay: 8000, credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });

export var REQUEST_PROFILES = Object.freeze({
  auth: { timeout: 5000, retries: 0, retryDelay: 0, backoffMultiplier: 1, maxRetryDelay: 0, description: 'Authentication operations' },
  default: { timeout: 10000, retries: 2, retryDelay: 1000, backoffMultiplier: 2, maxRetryDelay: 8000, description: 'Standard API operations' },
  longRun: { timeout: 30000, retries: 1, retryDelay: 2000, backoffMultiplier: 2, maxRetryDelay: 10000, description: 'Long running operations' },
  realtime: { timeout: 3000, retries: 0, retryDelay: 0, backoffMultiplier: 1, maxRetryDelay: 0, description: 'Real-time polling' }
});

export var RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504, 408, 429]);
export var AUTH_ERROR_STATUS_CODES = new Set([401, 403]);

export var ERROR_CODES = Object.freeze({ NETWORK_ERROR: 'NETWORK_ERROR', REQUEST_TIMEOUT: 'REQUEST_TIMEOUT', REQUEST_ABORTED: 'REQUEST_ABORTED', HTTP_ERROR: 'HTTP_ERROR', PARSE_ERROR: 'PARSE_ERROR', AUTH_REQUIRED: 'AUTH_REQUIRED', ACCESS_DENIED: 'ACCESS_DENIED', VALIDATION_ERROR: 'VALIDATION_ERROR', SERVER_ERROR: 'SERVER_ERROR', UNKNOWN_ERROR: 'UNKNOWN_ERROR' });

export var HTTP_STATUS_MESSAGES = Object.freeze({ 400: 'Requisição inválida', 401: 'Autenticação necessária', 403: 'Acesso negado', 404: 'Recurso não encontrado', 405: 'Método não permitido', 408: 'Timeout da requisição', 409: 'Conflito de dados', 422: 'Dados inválidos', 429: 'Muitas requisições', 500: 'Erro interno do servidor', 502: 'Gateway inválido', 503: 'Serviço indisponível', 504: 'Gateway timeout' });

export var RESPONSE_SHAPE = Object.freeze({ ok: false, success: false, status: 0, data: null, meta: {}, errors: [] });

export var TELEMETRY_ENDPOINT = '/api/telemetry/collect.php';

export function getVersion() { return VERSION; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, profilesCount: Object.keys(REQUEST_PROFILES).length }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { configReady: !!DEFAULT_CONFIG, profilesReady: Object.keys(REQUEST_PROFILES).length > 0 } }; }

export default { VERSION: VERSION, MODULE_ID: MODULE_ID, DEFAULT_CONFIG: DEFAULT_CONFIG, REQUEST_PROFILES: REQUEST_PROFILES, RETRYABLE_STATUS_CODES: RETRYABLE_STATUS_CODES, AUTH_ERROR_STATUS_CODES: AUTH_ERROR_STATUS_CODES, ERROR_CODES: ERROR_CODES, HTTP_STATUS_MESSAGES: HTTP_STATUS_MESSAGES, RESPONSE_SHAPE: RESPONSE_SHAPE, TELEMETRY_ENDPOINT: TELEMETRY_ENDPOINT, getVersion: getVersion, info: info, healthCheck: healthCheck };
