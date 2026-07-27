import { RESOURCE_TYPES } from "../../contracts/resource-contract.js";
import { createLogger } from "../../utils/logger.js";
import { RESOURCE_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "2.1.0-EVENT-CONSTANTS";
const MODULE_ID = "main.ui.container-main.resources.resource-manager.resource-registry";
const logger = createLogger("container-main:resource-registry");
function createResourceRegistry(options = {}) {
  const {
    panelRegistry,
    limitChecker,
    throttleController,
    emitter
  } = options;
  return {
    // Registra recurso para um painel
    register(panelId, resourceId, resource, resourceOptions = {}) {
      const { type = RESOURCE_TYPES.GENERIC, estimatedMemory = 0 } = resourceOptions;
      const violations = limitChecker.check(panelId, type, estimatedMemory);
      if (violations.length > 0 && throttleController.isThrottled(panelId)) {
        return { success: false, violations, throttled: true };
      }
      const record = panelRegistry.getOrCreate(panelId);
      record.resources.set(resourceId, {
        resource,
        type,
        estimatedMemory,
        createdAt: Date.now()
      });
      record.memoryUsage += estimatedMemory;
      record.lastActivity = Date.now();
      emitter?.emit(RESOURCE_EVENT_NAMES.REGISTERED, { panelId, resourceId, type });
      return { success: true, violations: [] };
    },
    // Remove recurso de um painel
    async unregister(panelId, resourceId) {
      const record = panelRegistry.get(panelId);
      if (!record) return false;
      const info = record.resources.get(resourceId);
      if (!info) return false;
      if (info.resource?.dispose) {
        try {
          await info.resource.dispose();
        } catch (e) {
          logger.warn("Dispose error", { panelId, resourceId, error: e.message });
        }
      }
      record.memoryUsage -= info.estimatedMemory;
      record.resources.delete(resourceId);
      emitter?.emit(RESOURCE_EVENT_NAMES.UNREGISTERED, { panelId, resourceId });
      return true;
    },
    // Obtém recurso
    get(panelId, resourceId) {
      const record = panelRegistry.get(panelId);
      return record?.resources.get(resourceId) || null;
    },
    // Verifica se recurso existe
    has(panelId, resourceId) {
      const record = panelRegistry.get(panelId);
      return record?.resources.has(resourceId) || false;
    },
    // Conta recursos de um painel
    count(panelId) {
      const record = panelRegistry.get(panelId);
      return record?.resources.size || 0;
    }
  };
}
var resource_registry_default = { createResourceRegistry };
export {
  MODULE_ID,
  VERSION,
  createResourceRegistry,
  resource_registry_default as default
};
