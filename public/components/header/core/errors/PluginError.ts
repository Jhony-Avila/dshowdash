// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/errors/PluginError
// PURPOSE: Erro de plugin inválido ou com falha
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BaseError from ./BaseError.js
// PROVIDES:
//   VERSION — versão do módulo
//   PluginError(message, pluginId, context) — construtor
//   PluginError.invalidPlugin(pluginId, reason) — plugin inválido
//   PluginError.alreadyRegistered(pluginId) — plugin já registrado
//   PluginError.notFound(pluginId) — plugin não encontrado
//   PluginError.initFailed(pluginId, error) — falha na inicialização
//   PluginError.hookFailed(pluginId, hookName, error) — falha no hook
// ═══════════════════════════════════════════════════════════════
// Header - PluginError
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B02: var → const
'use strict';

import { BaseError } from './BaseError.js';

export const MODULE_ID = 'header.core.errors.PluginError';

export const VERSION = '1.1.0-ES6';

export function PluginError(this: any, message: string, pluginId: string, context: Record<string,unknown>) {
  BaseError.call(this, message, 'PLUGIN_ERROR', Object.assign({ pluginId }, context));
  this.name = 'PluginError';
  this.pluginId = pluginId || 'unknown';
}

PluginError.prototype = Object.create(BaseError.prototype);
PluginError.prototype.constructor = PluginError;

PluginError.invalidPlugin = (pluginId: string, reason: string) => (new (PluginError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Plugin inválido: ${reason}`, pluginId, { reason: 'INVALID_PLUGIN', details: reason }));

PluginError.alreadyRegistered = (pluginId: string) => (new (PluginError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Plugin já registrado: ${pluginId}`, pluginId, { reason: 'ALREADY_REGISTERED' }));

PluginError.notFound = (pluginId: string) => (new (PluginError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Plugin não encontrado: ${pluginId}`, pluginId, { reason: 'NOT_FOUND' }));

// @ts-expect-error TS migration - TS2339
PluginError.initFailed = (pluginId: string, error: unknown) => (new (PluginError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Falha ao inicializar plugin: ${error.message || error}`, pluginId, { reason: 'INIT_FAILED', originalError: error.message || error }));

// @ts-expect-error TS migration - TS2339
PluginError.hookFailed = (pluginId: string, hookName: string, error: unknown) => (new (PluginError as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(`Falha no hook ${hookName} do plugin`, pluginId, { reason: 'HOOK_FAILED', hookName, originalError: error.message || error }));

export default PluginError;
