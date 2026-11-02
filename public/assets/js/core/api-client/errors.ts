// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: api-client-errors
// PURPOSE: API Client - Error Classes v3.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ERROR_CODES, HTTP_STATUS_MESSAGES from ./config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   createErrorFromStatus() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   APIError() — exported function
//   NetworkError() — exported function
//   TimeoutError() — exported function
//   HTTPError() — exported function
//   AbortError() — exported function
//   ParseError() — exported function
//   AuthRequiredError() — exported function
//   AccessDeniedError() — exported function
//   ValidationError() — exported function
//   ServerError() — exported function
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

import { ERROR_CODES, HTTP_STATUS_MESSAGES } from './config.js';

export var VERSION = '3.1.0-ENTERPRISE';
export var MODULE_ID = 'api-client-errors';

export function getVersion() { return VERSION; }

interface ErrorDetails {
  status?: number;
  url?: string;
  method?: string;
  retryable?: boolean;
  traceId?: string;
  context?: Record<string, unknown>;
  errors?: unknown[];
}

interface APIErrorConstructor {
  new (code: string, message: string, details?: ErrorDetails): Error & { code: string; status: number | null; url: string | null; method: string | null; retryable: boolean; timestamp: number; traceId: string | null; context: Record<string, unknown> };
  (code: string, message: string, details?: ErrorDetails): void;
  prototype: Error;
}

interface SubErrorConstructor {
  new (...args: unknown[]): Error;
  (...args: unknown[]): void;
  prototype: Error;
}

function APIError(this: Record<string, unknown>, code: string, message: string, details: ErrorDetails = {}) {
  if (!details) details = {};
  Error.call(this, message);
  this.name = 'APIError';
  this.message = message;
  this.code = code;
  this.status = details.status || null;
  this.url = details.url || null;
  this.method = details.method || null;
  this.retryable = details.retryable || false;
  this.timestamp = Date.now();
  this.traceId = details.traceId || null;
  this.context = details.context || {};
}
APIError.prototype = Object.create(Error.prototype);
APIError.prototype.constructor = APIError;
APIError.prototype.toJSON = function() { return { name: this.name, code: this.code, message: this.message, status: this.status, url: this.url, method: this.method, retryable: this.retryable, timestamp: this.timestamp, traceId: this.traceId }; };

function NetworkError(this: Record<string, unknown>, message: string, details: ErrorDetails = {}) {
  if (!details) details = {};
  details.retryable = true;
  APIError.call(this, ERROR_CODES.NETWORK_ERROR, message || 'Erro de conexão', details);
  this.name = 'NetworkError';
}
NetworkError.prototype = Object.create(APIError.prototype);
NetworkError.prototype.constructor = NetworkError;

function TimeoutError(this: Record<string, unknown>, timeout: number, details: ErrorDetails = {}) {
  if (!details) details = {};
  details.retryable = true;
  APIError.call(this, ERROR_CODES.REQUEST_TIMEOUT, 'Timeout após ' + timeout + 'ms', details);
  this.name = 'TimeoutError';
  this.timeout = timeout;
}
TimeoutError.prototype = Object.create(APIError.prototype);
TimeoutError.prototype.constructor = TimeoutError;

function HTTPError(this: Record<string, unknown>, status: number, statusText: string, details: ErrorDetails = {}) {
  var message = (HTTP_STATUS_MESSAGES as Record<number, string>)[status] || statusText || 'HTTP ' + status;
  var retryable = details.retryable !== undefined ? details.retryable : false;
  details.status = status;
  details.retryable = retryable;
  APIError.call(this, ERROR_CODES.HTTP_ERROR, message, details);
  this.name = 'HTTPError';
  this.statusText = statusText;
}
HTTPError.prototype = Object.create(APIError.prototype);
HTTPError.prototype.constructor = HTTPError;

function AbortError(this: Record<string, unknown>, details: ErrorDetails = {}) {
  details.retryable = false;
  APIError.call(this, ERROR_CODES.REQUEST_ABORTED, 'Requisição cancelada', details);
  this.name = 'AbortError';
}
AbortError.prototype = Object.create(APIError.prototype);
AbortError.prototype.constructor = AbortError;

function ParseError(this: Record<string, unknown>, message: string, details: ErrorDetails = {}) {
  details.retryable = false;
  APIError.call(this, ERROR_CODES.PARSE_ERROR, message || 'Erro ao processar resposta', details);
  this.name = 'ParseError';
}
ParseError.prototype = Object.create(APIError.prototype);
ParseError.prototype.constructor = ParseError;

function AuthRequiredError(this: Record<string, unknown>, details: ErrorDetails = {}) {
  details.status = 401;
  details.retryable = false;
  APIError.call(this, ERROR_CODES.AUTH_REQUIRED, 'Autenticação necessária', details);
  this.name = 'AuthRequiredError';
}
AuthRequiredError.prototype = Object.create(APIError.prototype);
AuthRequiredError.prototype.constructor = AuthRequiredError;

function AccessDeniedError(this: Record<string, unknown>, details: ErrorDetails = {}) {
  details.status = 403;
  details.retryable = false;
  APIError.call(this, ERROR_CODES.ACCESS_DENIED, 'Acesso negado', details);
  this.name = 'AccessDeniedError';
}
AccessDeniedError.prototype = Object.create(APIError.prototype);
AccessDeniedError.prototype.constructor = AccessDeniedError;

function ValidationError(this: Record<string, unknown>, errors: unknown[] = [], details: ErrorDetails = {}) {
  details.status = 422;
  details.retryable = false;
  APIError.call(this, ERROR_CODES.VALIDATION_ERROR, 'Dados inválidos', details);
  this.name = 'ValidationError';
  this.validationErrors = errors;
}
ValidationError.prototype = Object.create(APIError.prototype);
ValidationError.prototype.constructor = ValidationError;

function ServerError(this: Record<string, unknown>, status: number, message: string, details: ErrorDetails = {}) {
  details.status = status;
  details.retryable = true;
  APIError.call(this, ERROR_CODES.SERVER_ERROR, message || (HTTP_STATUS_MESSAGES as Record<number, string>)[status] || 'Erro do servidor', details);
  this.name = 'ServerError';
}
ServerError.prototype = Object.create(APIError.prototype);
ServerError.prototype.constructor = ServerError;

export function createErrorFromStatus(status: number, statusText: string, details: ErrorDetails = {}) {
  if (status === 401) return new (AuthRequiredError as SubErrorConstructor)(details);
  if (status === 403) return new (AccessDeniedError as SubErrorConstructor)(details);
  if (status === 422) return new (ValidationError as SubErrorConstructor)(details.errors || [], details);
  if (status >= 500) return new (ServerError as SubErrorConstructor)(status, statusText, details);
  return new (HTTPError as SubErrorConstructor)(status, statusText, details);
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { apiErrorReady: typeof APIError === 'function', createErrorReady: typeof createErrorFromStatus === 'function' } }; }

export { APIError, NetworkError, TimeoutError, HTTPError, AbortError, ParseError, AuthRequiredError, AccessDeniedError, ValidationError, ServerError };

export default { APIError: APIError, NetworkError: NetworkError, TimeoutError: TimeoutError, HTTPError: HTTPError, AbortError: AbortError, ParseError: ParseError, AuthRequiredError: AuthRequiredError, AccessDeniedError: AccessDeniedError, ValidationError: ValidationError, ServerError: ServerError, createErrorFromStatus: createErrorFromStatus, getVersion: getVersion, info: info, healthCheck: healthCheck };
