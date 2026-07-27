// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/errors/ConfigError
// PURPOSE: Erro de configuração inválida ou ausente
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BaseError from ./BaseError.js
// PROVIDES:
//   VERSION — versão do módulo
//   ConfigError(message, field, expectedType, actualValue, context) — construtor
//   ConfigError.missingField(field) — campo obrigatório ausente
//   ConfigError.invalidType(field, expectedType, actualValue) — tipo inválido
//   ConfigError.outOfRange(field, value, min, max) — valor fora do range
//   ConfigError.invalidValue(field, value, allowedValues) — valor inválido
// ═══════════════════════════════════════════════════════════════
// Header - ConfigError
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B02: var → const
'use strict';

import { BaseError } from './BaseError.js';

export const MODULE_ID = 'header.core.errors.ConfigError';

export const VERSION = '1.1.0-ES6';

export function ConfigError(this: any, message: string, field: unknown, expectedType: string, actualValue: unknown, context: Record<string,unknown>) {
  BaseError.call(this, message, 'CONFIG_ERROR', Object.assign({ field, expectedType, actualValue }, context));
  this.name = 'ConfigError';
  this.field = field || 'unknown';
  this.expectedType = expectedType || null;
  this.actualValue = actualValue;
}

ConfigError.prototype = Object.create(BaseError.prototype);
ConfigError.prototype.constructor = ConfigError;

ConfigError.missingField = (field: unknown) => (new (ConfigError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Campo obrigatório ausente: ${field}`, field, null, undefined, { reason: 'MISSING_FIELD' }));

ConfigError.invalidType = (field: unknown, expectedType: string, actualValue: unknown) => {
  const actualType = typeof actualValue;
  return (new (ConfigError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Tipo inválido para ${field}: esperado ${expectedType}, recebido ${actualType}`, field, expectedType, actualValue, { reason: 'INVALID_TYPE', actualType }));
};

ConfigError.outOfRange = (field: unknown, value: unknown, min: number, max: number) => (new (ConfigError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Valor fora do range para ${field}: ${value} (min: ${min}, max: ${max})`, field, 'number', value, { reason: 'OUT_OF_RANGE', min, max }));

ConfigError.invalidValue = (field: unknown, value: unknown, allowedValues: unknown) => (new (ConfigError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Valor inválido para ${field}: ${value}`, field, 'enum', value, { reason: 'INVALID_VALUE', allowedValues }));

export default ConfigError;
