// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/errors
// PURPOSE: Barrel export de todas as classes de erro customizadas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MountError from ./MountError.js
//   TimeoutError from ./TimeoutError.js
//   ContractError from ./ContractError.js
//   NetworkError from ./NetworkError.js
//   ConfigError from ./ConfigError.js
//   PluginError from ./PluginError.js
// PROVIDES:
//   VERSION — versão do módulo
//   MODULE_ID — identificador do módulo
//   Re-exports: MountError, TimeoutError, ContractError,
//     NetworkError, ConfigError, PluginError
// ═══════════════════════════════════════════════════════════════
// Header - Errors (Index)
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B01: var → const
// Exporta todas as classes de erro customizadas
'use strict';

export { BaseError } from './BaseError.js';
export { MountError } from './MountError.js';
export { TimeoutError } from './TimeoutError.js';
export { ContractError } from './ContractError.js';
export { NetworkError } from './NetworkError.js';
export { ConfigError } from './ConfigError.js';
export { PluginError } from './PluginError.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/errors';

export default {
  VERSION,
  MODULE_ID
};
