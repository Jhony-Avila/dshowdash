// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/errors/TimeoutError
// PURPOSE: Erro de timeout em operações assíncronas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BaseError from ./BaseError.js
// PROVIDES:
//   VERSION — versão do módulo
//   TimeoutError(message, operation, timeoutMs, context) — construtor
//   TimeoutError.mount(componentName, timeoutMs) — timeout de mount
//   TimeoutError.api(endpoint, timeoutMs) — timeout de API
//   TimeoutError.healthCheck(componentName, timeoutMs) — timeout de health check
// ═══════════════════════════════════════════════════════════════
// Header - TimeoutError
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B02: var → const
'use strict';

import { BaseError } from './BaseError.js';

export const VERSION = '1.1.0-ES6';

export const MODULE_ID = 'header.core.errors.TimeoutError';

export function TimeoutError(this: any, message: string, operation: string, timeoutMs: unknown, context: Record<string,unknown>) {
  BaseError.call(this, message, 'TIMEOUT_ERROR', Object.assign({ operation, timeoutMs }, context));
  this.name = 'TimeoutError';
  this.operation = operation || 'unknown';
  this.timeoutMs = timeoutMs || 0;
}

TimeoutError.prototype = Object.create(BaseError.prototype);
TimeoutError.prototype.constructor = TimeoutError;

TimeoutError.mount = (componentName: string, timeoutMs: unknown) => (new (TimeoutError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Timeout ao montar componente: ${componentName}`, 'mount', timeoutMs, { componentName }));

TimeoutError.api = (endpoint: string, timeoutMs: unknown) => (new (TimeoutError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Timeout na requisição: ${endpoint}`, 'api', timeoutMs, { endpoint }));

TimeoutError.healthCheck = (componentName: string, timeoutMs: unknown) => (new (TimeoutError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Timeout no health check: ${componentName}`, 'healthCheck', timeoutMs, { componentName }));

export default TimeoutError;
