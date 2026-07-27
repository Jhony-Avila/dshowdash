// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/errors/MountError
// PURPOSE: Erro de montagem de componente no DOM
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BaseError from ./BaseError.js
// PROVIDES:
//   VERSION — versão do módulo
//   MountError(message, componentName, context) — construtor
//   MountError.containerNotFound(componentName, selector) — container ausente
//   MountError.classNotFound(componentName, modulePath) — classe não encontrada
//   MountError.alreadyMounted(componentName) — componente já montado
//   MountError.circuitBreakerOpen(componentName) — circuit breaker aberto
// ═══════════════════════════════════════════════════════════════
// Header - MountError
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B02: var → const
'use strict';

import { BaseError } from './BaseError.js';

export const MODULE_ID = 'header.core.errors.MountError';

export const VERSION = '1.1.0-ES6';

export function MountError(this: any, message: string, componentName: string, context: Record<string,unknown>) {
  BaseError.call(this, message, 'MOUNT_ERROR', Object.assign({ componentName }, context));
  this.name = 'MountError';
  this.componentName = componentName || 'unknown';
}

MountError.prototype = Object.create(BaseError.prototype);
MountError.prototype.constructor = MountError;

MountError.containerNotFound = (componentName: string, selector: string) => (new (MountError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Container não encontrado: ${selector}`, componentName, { selector, reason: 'CONTAINER_NOT_FOUND' }));

MountError.classNotFound = (componentName: string, modulePath: string) => (new (MountError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })('Classe do componente não encontrada', componentName, { modulePath, reason: 'CLASS_NOT_FOUND' }));

MountError.alreadyMounted = (componentName: string) => (new (MountError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })('Componente já está montado', componentName, { reason: 'ALREADY_MOUNTED' }));

MountError.circuitBreakerOpen = (componentName: string) => (new (MountError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })('Circuit breaker aberto - muitas falhas recentes', componentName, { reason: 'CIRCUIT_BREAKER_OPEN' }));

export default MountError;
