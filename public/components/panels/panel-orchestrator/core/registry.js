import orchestratorStore from "../state/store.js";
import orchestratorBus from "../bus/event-bus-adapter.js";
import { ORCHESTRATOR_EVENTS } from "../bus/events-map.js";
import { validateModuleContract } from "../utils/validators.js";
import { normalizeModuleConfig } from "../utils/normalization.js";
import logger from "../utils/logger.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-registry";
function ModuleRegistry() {
  this.modules = /* @__PURE__ */ new Map();
  this.aliases = /* @__PURE__ */ new Map();
  this.initialized = false;
  this.destroyed = false;
}
ModuleRegistry.prototype.getVersion = () => VERSION;
ModuleRegistry.prototype.isInitialized = function() {
  return this.modules.size > 0 || this.initialized;
};
ModuleRegistry.prototype.register = function(config) {
  const validation = validateModuleContract(config);
  if (!validation.valid) {
    logger.error("Registro inv\xE1lido", { id: config.id, errors: validation.errors });
    throw new Error(`Contrato inv\xE1lido: ${validation.errors.join(", ")}`);
  }
  const normalized = normalizeModuleConfig(config);
  const id = normalized.id;
  if (this.modules.has(id)) {
    logger.warn("M\xF3dulo j\xE1 registrado, sobrescrevendo", { id });
  }
  this.modules.set(id, Object.assign({}, normalized, { registeredAt: Date.now(), mountCount: 0, lastMount: null, lastError: null, errorCount: 0 }));
  orchestratorStore.registerModule(id, normalized);
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_REGISTERED, { moduleId: id, type: normalized.type, critical: normalized.critical });
  logger.info(`M\xF3dulo registrado: ${id}`, { type: normalized.type });
  return id;
};
ModuleRegistry.prototype.unregister = function(id) {
  const self = this;
  if (!this.modules.has(id)) {
    logger.warn("M\xF3dulo n\xE3o encontrado para remover", { id });
    return false;
  }
  this.modules.delete(id);
  orchestratorStore.unregisterModule(id);
  this.aliases.forEach((moduleId, alias) => {
    if (moduleId === id) self.aliases.delete(alias);
  });
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_UNREGISTERED, { moduleId: id });
  logger.info(`M\xF3dulo removido: ${id}`);
  return true;
};
ModuleRegistry.prototype.get = function(id) {
  if (this.aliases.has(id)) id = this.aliases.get(id);
  return this.modules.get(id) || null;
};
ModuleRegistry.prototype.has = function(id) {
  if (this.aliases.has(id)) id = this.aliases.get(id);
  return this.modules.has(id);
};
ModuleRegistry.prototype.getAll = function() {
  return Array.from(this.modules.values());
};
ModuleRegistry.prototype.getAllIds = function() {
  return Array.from(this.modules.keys());
};
ModuleRegistry.prototype.getCritical = function() {
  return this.getAll().filter((m) => m.critical === true);
};
ModuleRegistry.prototype.getByType = function(type) {
  return this.getAll().filter((m) => m.type === type);
};
ModuleRegistry.prototype.addAlias = function(alias, moduleId) {
  if (!this.modules.has(moduleId)) {
    logger.warn("M\xF3dulo n\xE3o existe para alias", { alias, moduleId });
    return false;
  }
  this.aliases.set(alias, moduleId);
  return true;
};
ModuleRegistry.prototype.removeAlias = function(alias) {
  return this.aliases.delete(alias);
};
ModuleRegistry.prototype.recordMount = function(id) {
  const module = this.modules.get(id);
  if (module) {
    module.mountCount++;
    module.lastMount = Date.now();
  }
};
ModuleRegistry.prototype.recordError = function(id, error) {
  const module = this.modules.get(id);
  if (module) {
    module.errorCount++;
    module.lastError = { message: error.message || String(error), timestamp: Date.now() };
  }
};
ModuleRegistry.prototype.resetErrorCount = function(id) {
  const module = this.modules.get(id);
  if (module) {
    module.errorCount = 0;
    module.lastError = null;
  }
};
ModuleRegistry.prototype.getStats = function() {
  const modules = this.getAll();
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    total: modules.length,
    byType: { panel: modules.filter((m) => m.type === "panel").length, card: modules.filter((m) => m.type === "card").length, widget: modules.filter((m) => m.type === "widget").length, service: modules.filter((m) => m.type === "service").length },
    critical: modules.filter((m) => m.critical).length,
    withErrors: modules.filter((m) => m.errorCount > 0).length,
    aliases: this.aliases.size
  };
};
ModuleRegistry.prototype.clear = function() {
  this.modules.clear();
  this.aliases.clear();
  logger.info("Registry limpo");
};
ModuleRegistry.prototype.reset = function() {
  this.clear();
  this.destroyed = false;
};
ModuleRegistry.prototype.toJSON = function() {
  return { version: VERSION, moduleId: MODULE_ID, modules: Array.from(this.modules.entries()), aliases: Array.from(this.aliases.entries()), stats: this.getStats() };
};
const moduleRegistry = new ModuleRegistry();
var registry_default = moduleRegistry;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { registryReady: true } };
}
export {
  MODULE_ID,
  ModuleRegistry,
  VERSION,
  registry_default as default,
  healthCheck,
  info,
  moduleRegistry
};
