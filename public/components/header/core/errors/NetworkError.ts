// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/errors/NetworkError
// PURPOSE: Erro de rede e comunicação com APIs
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BaseError from ./BaseError.js
// PROVIDES:
//   VERSION — versão do módulo
//   NetworkError(message, endpoint, statusCode, context) — construtor
//   NetworkError.offline() — sem conexão
//   NetworkError.serverError(endpoint, statusCode) — erro do servidor
//   NetworkError.unauthorized(endpoint) — não autorizado (401)
//   NetworkError.forbidden(endpoint) — acesso negado (403)
//   NetworkError.notFound(endpoint) — recurso não encontrado (404)
// ═══════════════════════════════════════════════════════════════
// Header - NetworkError
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B03: var → const
'use strict';

import { BaseError } from './BaseError.js';

export const MODULE_ID = 'header.core.errors.NetworkError';

export const VERSION = '1.1.0-ES6';

export function NetworkError(this: any, message: string, endpoint: string, statusCode: string, context: Record<string,unknown>) {
  BaseError.call(this, message, 'NETWORK_ERROR', Object.assign({ endpoint, statusCode }, context));
  this.name = 'NetworkError';
  this.endpoint = endpoint || 'unknown';
  this.statusCode = statusCode || null;
}

NetworkError.prototype = Object.create(BaseError.prototype);
NetworkError.prototype.constructor = NetworkError;

NetworkError.offline = () => (new (NetworkError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })('Sem conexão com a internet', null, null, { reason: 'OFFLINE' }));

NetworkError.serverError = (endpoint: string, statusCode: string) => (new (NetworkError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Erro do servidor: ${statusCode}`, endpoint, statusCode, { reason: 'SERVER_ERROR' }));

NetworkError.unauthorized = (endpoint: string) => (new (NetworkError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })('Não autorizado', endpoint, 401, { reason: 'UNAUTHORIZED' }));

NetworkError.forbidden = (endpoint: string) => (new (NetworkError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })('Acesso negado', endpoint, 403, { reason: 'FORBIDDEN' }));

NetworkError.notFound = (endpoint: string) => (new (NetworkError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })('Recurso não encontrado', endpoint, 404, { reason: 'NOT_FOUND' }));

export default NetworkError;
