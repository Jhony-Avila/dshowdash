// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/errors/ContractError
// PURPOSE: Erro de contrato de componente inválido
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BaseError from ./BaseError.js
// PROVIDES:
//   VERSION — versão do módulo
//   ContractError(message, componentName, issues, context) — construtor
//   ContractError.missingMethod(componentName, methodName) — método ausente
//   ContractError.missingProperty(componentName, propertyName) — propriedade ausente
//   ContractError.invalid(componentName, issues) — contrato inválido
// ═══════════════════════════════════════════════════════════════
// Header - ContractError
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B02: var → const
'use strict';

import { BaseError } from './BaseError.js';

export const MODULE_ID = 'header.core.errors.ContractError';

export const VERSION = '1.1.0-ES6';

export function ContractError(this: any, message: string, componentName: string, issues: boolean, context: Record<string,unknown>) {
  BaseError.call(this, message, 'CONTRACT_ERROR', Object.assign({ componentName, issues }, context));
  this.name = 'ContractError';
  this.componentName = componentName || 'unknown';
  this.issues = issues || [];
}

ContractError.prototype = Object.create(BaseError.prototype);
ContractError.prototype.constructor = ContractError;

ContractError.missingMethod = (componentName: string, methodName: string) => (new (ContractError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Método obrigatório ausente: ${methodName}`, componentName, [`missing:${methodName}`], { methodName }));

ContractError.missingProperty = (componentName: string, propertyName: string) => (new (ContractError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Propriedade obrigatória ausente: ${propertyName}`, componentName, [`missing:${propertyName}`], { propertyName }));


// @ts-expect-error TS migration - TS2554
ContractError.invalid = (componentName, issues) => new ContractError(`Contrato inválido: ${issues.join(', ')}`, componentName, issues);

export default ContractError;
