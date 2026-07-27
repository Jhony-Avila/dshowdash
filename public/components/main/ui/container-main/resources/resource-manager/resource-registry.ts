// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: resource-registry
// PURPOSE: Resource Manager Resource Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RESOURCE_TYPES from ../../contracts/resource-contract.js
//   createLogger from ../../utils/logger.js
//   RESOURCE_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createResourceRegistry() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   RESOURCE_EVENT_NAMES.REGISTERED
//   RESOURCE_EVENT_NAMES.UNREGISTERED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { RESOURCE_TYPES } from '../../contracts/resource-contract.js';
import { createLogger } from '../../utils/logger.js';
import { RESOURCE_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '2.1.0-EVENT-CONSTANTS';
export const MODULE_ID = 'main.ui.container-main.resources.resource-manager.resource-registry';

const logger = createLogger('container-main:resource-registry');

export function createResourceRegistry(options: Record<string, any> = {}) {
  const { 
    panelRegistry, 
    limitChecker, 
    throttleController, 
    emitter 
  } = options;

  return {
    // Registra recurso para um painel
    register(panelId: string, resourceId: string, resource: Record<string, unknown>, resourceOptions: Record<string, any> = {}) {
      const { type = RESOURCE_TYPES.GENERIC, estimatedMemory = 0 } = resourceOptions;
      
      // Verifica limites
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
      return { success: true, violations: [] as unknown[] };
    },

    // Remove recurso de um painel
    async unregister(panelId: string, resourceId: string) {
      const record = panelRegistry.get(panelId);
      if (!record) return false;

      const info = record.resources.get(resourceId);
      if (!info) return false;

      // Dispose se disponível
      if (info.resource?.dispose) {
        try {
          await info.resource.dispose();
        } catch (e: any) {
          logger.warn('Dispose error', { panelId, resourceId, error: e.message });
        }
      }

      record.memoryUsage -= info.estimatedMemory;
      record.resources.delete(resourceId);

      emitter?.emit(RESOURCE_EVENT_NAMES.UNREGISTERED, { panelId, resourceId });
      return true;
    },

    // Obtém recurso
    get(panelId: string, resourceId: string) {
      const record = panelRegistry.get(panelId);
      return record?.resources.get(resourceId) || null;
    },

    // Verifica se recurso existe
    has(panelId: string, resourceId: string) {
      const record = panelRegistry.get(panelId);
      return record?.resources.has(resourceId) || false;
    },

    // Conta recursos de um painel
    count(panelId: string) {
      const record = panelRegistry.get(panelId);
      return record?.resources.size || 0;
    }
  };
}

export default { createResourceRegistry };
