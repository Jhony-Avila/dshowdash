// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-error-handler
// PURPOSE: Login Modal - Error Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   ERROR_TAXONOMY — exported value
//   formatTime() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   ErrorHandler — exported class
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

const MODULE_ID = 'login-modal-error-handler';
const VERSION = '5.5.0-ENTERPRISE';

export const ERROR_TAXONOMY = { NETWORK: { category: 'NETWORK', codes: { TIMEOUT: { code: 'REQUEST_TIMEOUT', severity: 'warning' }, ABORTED: { code: 'REQUEST_ABORTED', severity: 'info' }, OFFLINE: { code: 'NETWORK_ERROR', severity: 'error' } } }, AUTH: { category: 'AUTH', codes: { INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS', severity: 'warning' }, FORBIDDEN: { code: 'ACCESS_DENIED', severity: 'error' } } }, VALIDATION: { category: 'VALIDATION', codes: { INVALID_INPUT: { code: 'VALIDATION_ERROR', severity: 'warning' }, NOT_FOUND: { code: 'NOT_FOUND', severity: 'warning' } } }, RATE_LIMIT: { category: 'RATE_LIMIT', codes: { TOO_MANY_REQUESTS: { code: 'RATE_LIMITED', severity: 'warning' }, LOCKED: { code: 'ACCOUNT_LOCKED', severity: 'error' } } }, SERVER: { category: 'SERVER', codes: { INTERNAL: { code: 'SERVER_ERROR', severity: 'error' }, UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', severity: 'error' } } }, UNKNOWN: { category: 'UNKNOWN', codes: { GENERIC: { code: 'UNKNOWN_ERROR', severity: 'error' } } } };

const STATUS_CODE_MAP: Record<number, any> = { 0: ERROR_TAXONOMY.NETWORK.codes.OFFLINE, 400: ERROR_TAXONOMY.VALIDATION.codes.INVALID_INPUT, 401: ERROR_TAXONOMY.AUTH.codes.INVALID_CREDENTIALS, 403: ERROR_TAXONOMY.AUTH.codes.FORBIDDEN, 404: ERROR_TAXONOMY.VALIDATION.codes.NOT_FOUND, 429: ERROR_TAXONOMY.RATE_LIMIT.codes.TOO_MANY_REQUESTS, 500: ERROR_TAXONOMY.SERVER.codes.INTERNAL, 503: ERROR_TAXONOMY.SERVER.codes.UNAVAILABLE };

export class ErrorHandler {
  [key: string]: any;
  constructor(config: Record<string, any> = {}) { if (typeof config.info === 'function' || typeof config.error === 'function') { this.logger = config; this.config = {}; this.secureMode = false; this.verbose = false; } else { this.config = config; this.logger = config.logger || console; this.secureMode = config.security?.secureMode || false; this.verbose = config.debug || false; } this._metrics = { classifications: 0, errors: 0 }; }

  classify(error: Record<string, any>, context: Record<string, any> = {}) {
    this._metrics.classifications++;
    if (context.rateLimiter?.isLocked()) { return { root: ERROR_TAXONOMY.RATE_LIMIT.category, code: ERROR_TAXONOMY.RATE_LIMIT.codes.LOCKED.code, severity: ERROR_TAXONOMY.RATE_LIMIT.codes.LOCKED.severity, source: 'rate-limiter', data: { remainingTime: context.rateLimiter.getRemainingTime() } }; }
    if (error.status !== undefined && error.status !== null) { const taxonomy = STATUS_CODE_MAP[error.status] || ERROR_TAXONOMY.UNKNOWN.codes.GENERIC; return { root: this._getRootFromTaxonomy(taxonomy), code: taxonomy.code, severity: taxonomy.severity, source: 'http', httpStatus: error.status, data: this._extractErrorData(error) }; }
    if (error.name === 'AbortError' || error.code === 'REQUEST_ABORTED') { return { root: ERROR_TAXONOMY.NETWORK.category, code: ERROR_TAXONOMY.NETWORK.codes.ABORTED.code, severity: ERROR_TAXONOMY.NETWORK.codes.ABORTED.severity, source: 'network' }; }
    if (error.code === 'REQUEST_TIMEOUT') { return { root: ERROR_TAXONOMY.NETWORK.category, code: ERROR_TAXONOMY.NETWORK.codes.TIMEOUT.code, severity: ERROR_TAXONOMY.NETWORK.codes.TIMEOUT.severity, source: 'network' }; }
    return { root: ERROR_TAXONOMY.UNKNOWN.category, code: ERROR_TAXONOMY.UNKNOWN.codes.GENERIC.code, severity: ERROR_TAXONOMY.UNKNOWN.codes.GENERIC.severity, source: 'unknown' };
  }

  format(classification: Record<string, any>, error: Record<string, any>, locale = 'pt-BR') { const msgs: Record<string, string> = { 'REQUEST_TIMEOUT': 'Tempo esgotado', 'NETWORK_ERROR': 'Erro de conexão', 'INVALID_CREDENTIALS': 'Usuário ou senha incorretos', 'RATE_LIMITED': 'Muitas tentativas', 'SERVER_ERROR': 'Erro no servidor', 'UNKNOWN_ERROR': 'Erro inesperado' }; return msgs[classification.code] || classification.code; }

  handleLoginError(error: Record<string, any>, rateLimiter: any, telemetry: any, latency = 0) { this._metrics.errors++; const classification = this.classify(error, { rateLimiter }); const errorMessage = this.format(classification, error); if (telemetry) { telemetry.trackError?.(classification.code, errorMessage, latency); } return { errorCode: classification.code, errorMessage, data: classification.data || {} }; }

  _getRootFromTaxonomy(taxonomy: Record<string, any>) { for (const [category, data] of Object.entries(ERROR_TAXONOMY)) { if ((Object.values((data as Record<string, any>).codes || {}) as Record<string, any>[]).includes(taxonomy)) { return category; } } return ERROR_TAXONOMY.UNKNOWN.category; }

  _extractErrorData(error: Record<string, any>) { const data: Record<string, unknown> = {}; if (error.retryAfter) { data.retryAfter = error.retryAfter > 10000 ? error.retryAfter : error.retryAfter * 1000; } return data; }

  info() { return { moduleId: MODULE_ID, version: VERSION, metrics: { ...this._metrics }, timestamp: Date.now() }; }

  healthCheck() { const checks = { hasLogger: !!this.logger, taxonomyLoaded: Object.keys(ERROR_TAXONOMY).length > 0 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
}

export function formatTime(ms: number) { if (ms <= 0) return '0s'; const seconds = Math.ceil(ms / 1000); if (seconds < 60) { return `${seconds}s`; } return `${Math.ceil(seconds / 60)}min`; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function healthCheck() { const checks = { moduleLoaded: true, classAvailable: typeof ErrorHandler === 'function' }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export { VERSION, MODULE_ID };
export default ErrorHandler;
