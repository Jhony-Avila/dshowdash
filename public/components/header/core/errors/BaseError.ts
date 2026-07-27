// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/errors/BaseError
// PURPOSE: Classe base para todos os erros customizados do Header
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   VERSION — versão do módulo
//   BaseError(message, code, context) — construtor de erro base
//   BaseError.prototype.toJSON() — serializa erro para JSON
//   BaseError.prototype.toString() — representação em string
// ═══════════════════════════════════════════════════════════════
// Header - BaseError
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B02: var → const
'use strict';

export const MODULE_ID = 'header.core.errors.BaseError';

export const VERSION = '1.1.0-ES6';

export function BaseError(this: any, message: string, code: unknown, context: Record<string,unknown>) {
  Error.call(this, message);
  this.name = 'BaseError';
  this.message = message || 'Erro desconhecido';
  this.code = code || 'UNKNOWN_ERROR';
  this.context = context || {};
  this.timestamp = Date.now();
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  }
}

BaseError.prototype = Object.create(Error.prototype);
BaseError.prototype.constructor = BaseError;

BaseError.prototype.toJSON = function() {
  return {
    name: this.name,
    message: this.message,
    code: this.code,
    context: this.context,
    timestamp: this.timestamp,
    stack: this.stack
  };
};

BaseError.prototype.toString = function() {
  return `${this.name} [${this.code}]: ${this.message}`;
};

export default BaseError;
