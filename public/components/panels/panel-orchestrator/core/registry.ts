// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-registry
// PURPOSE: Orchestrator Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ORCHESTRATOR_EVENTS from ../bus/events-map.js
//   validateModuleContract from ../utils/validators.js
//   normalizeModuleConfig from ../utils/normalization.js
//   orchestratorStore from ../state/store.js
//   orchestratorBus from ../bus/event-bus-adapter.js
//   logger from ../utils/logger.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   ModuleRegistry() — exported function
//   moduleRegistry — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ORCHESTRATOR_EVENTS.MODULE_REGISTERED
//   ORCHESTRATOR_EVENTS.MODULE_UNREGISTERED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import orchestratorStore from '../state/store.js';
import orchestratorBus from '../bus/event-bus-adapter.js';
import { ORCHESTRATOR_EVENTS } from '../bus/events-map.js';
import { validateModuleContract } from '../utils/validators.js';
import { normalizeModuleConfig } from '../utils/normalization.js';
import logger from '../utils/logger.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-registry';

function ModuleRegistry(this: any) {
  this.modules = new Map();
  this.aliases = new Map();
  this.initialized = false;
  this.destroyed = false;
}

ModuleRegistry.prototype.getVersion = () => VERSION;

ModuleRegistry.prototype.isInitialized = function() { return this.modules.size > 0 || this.initialized; };

ModuleRegistry.prototype.register = function(config: Record<string, unknown>) {
  const validation = validateModuleContract(config);
  if (!validation.valid) {
    logger.error('Registro inválido', { id: config.id, errors: validation.errors });
    throw new Error(`Contrato inválido: ${validation.errors.join(', ')}`);
  }
  const normalized = normalizeModuleConfig(config);
  const id = normalized.id;
  if (this.modules.has(id)) { logger.warn('Módulo já registrado, sobrescrevendo', { id }); }
  this.modules.set(id, Object.assign({}, normalized, { registeredAt: Date.now(), mountCount: 0, lastMount: null, lastError: null, errorCount: 0 }));
  orchestratorStore.registerModule(id, normalized);
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_REGISTERED, { moduleId: id, type: normalized.type, critical: normalized.critical });
  logger.info(`Módulo registrado: ${id}`, { type: normalized.type });
  return id;
};

ModuleRegistry.prototype.unregister = function(id: string) {
  const self = this;
  if (!this.modules.has(id)) { logger.warn('Módulo não encontrado para remover', { id }); return false; }
  this.modules.delete(id);
  orchestratorStore.unregisterModule(id);
  this.aliases.forEach((moduleId: string, alias: string) => { if (moduleId === id) self.aliases.delete(alias); });
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_UNREGISTERED, { moduleId: id });
  logger.info(`Módulo removido: ${id}`);
  return true;
};

ModuleRegistry.prototype.get = function(id: string) {
  if (this.aliases.has(id)) id = this.aliases.get(id);
  return this.modules.get(id) || null;
};

ModuleRegistry.prototype.has = function(id: string) {
  if (this.aliases.has(id)) id = this.aliases.get(id);
  return this.modules.has(id);
};

ModuleRegistry.prototype.getAll = function() { return Array.from(this.modules.values()); };
ModuleRegistry.prototype.getAllIds = function() { return Array.from(this.modules.keys()); };
ModuleRegistry.prototype.getCritical = function() { return this.getAll().filter((m: Record<string, unknown>) => m.critical === true); };
ModuleRegistry.prototype.getByType = function(type: string) { return this.getAll().filter((m: Record<string, unknown>) => m.type === type); };

ModuleRegistry.prototype.addAlias = function(alias: string, moduleId: string) {
  if (!this.modules.has(moduleId)) { logger.warn('Módulo não existe para alias', { alias, moduleId }); return false; }
  this.aliases.set(alias, moduleId);
  return true;
};

ModuleRegistry.prototype.removeAlias = function(alias: string) { return this.aliases.delete(alias); };

ModuleRegistry.prototype.recordMount = function(id: string) {
  const module = this.modules.get(id);
  if (module) { module.mountCount++; module.lastMount = Date.now(); }
};

ModuleRegistry.prototype.recordError = function(id: string, error: unknown) {
  const module = this.modules.get(id);
  if (module) { module.errorCount++; module.lastError = { message: (error as Error).message || String(error), timestamp: Date.now() }; }
};

ModuleRegistry.prototype.resetErrorCount = function(id: string) {
  const module = this.modules.get(id);
  if (module) { module.errorCount = 0; module.lastError = null; }
};

ModuleRegistry.prototype.getStats = function() {
  const modules = this.getAll();
  return {
    version: VERSION, moduleId: MODULE_ID, total: modules.length,
    byType: { panel: modules.filter((m: Record<string, unknown>) => m.type === 'panel').length, card: modules.filter((m: Record<string, unknown>) => m.type === 'card').length, widget: modules.filter((m: Record<string, unknown>) => m.type === 'widget').length, service: modules.filter((m: Record<string, unknown>) => m.type === 'service').length },
    critical: modules.filter((m: Record<string, unknown>) => m.critical).length,
    withErrors: modules.filter((m: Record<string, unknown>) => (m.errorCount as number) > 0).length,
    aliases: this.aliases.size
  };
};

ModuleRegistry.prototype.clear = function() { this.modules.clear(); this.aliases.clear(); logger.info('Registry limpo'); };
ModuleRegistry.prototype.reset = function() { this.clear(); this.destroyed = false; };

ModuleRegistry.prototype.toJSON = function() {
  return { version: VERSION, moduleId: MODULE_ID, modules: Array.from(this.modules.entries()), aliases: Array.from(this.aliases.entries()), stats: this.getStats() };
};

// @ts-expect-error strict migration — TS7009
const moduleRegistry = new ModuleRegistry();

export default moduleRegistry;
export { ModuleRegistry, moduleRegistry, VERSION, MODULE_ID };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { registryReady: true } }; }
