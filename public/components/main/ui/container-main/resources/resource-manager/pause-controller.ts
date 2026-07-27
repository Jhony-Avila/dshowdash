// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: pause-controller
// PURPOSE: Resource Manager Pause Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegisteredResources, getResourcesByType from ../../contracts/resource-cont...
//   RESOURCE_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createPauseController() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   RESOURCE_EVENT_NAMES.ALL_PAUSED
//   RESOURCE_EVENT_NAMES.ALL_RESUMED
//   RESOURCE_EVENT_NAMES.PANEL_PAUSED
//   RESOURCE_EVENT_NAMES.PANEL_RESUMED
//   RESOURCE_EVENT_NAMES.TYPE_PAUSED
//   RESOURCE_EVENT_NAMES.TYPE_RESUMED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { 
  getRegisteredResources,
  getResourcesByType 
} from '../../contracts/resource-contract.js';
import { RESOURCE_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '2.1.0-EVENT-CONSTANTS';
export const MODULE_ID = 'main.ui.container-main.resources.resource-manager.pause-controller';

export function createPauseController(options: Record<string, any> = {}) {
  const { panelRegistry, emitter } = options;

  return {
    // Pausa recursos por tipo
    pauseByType(type: string) {
      const resources = getResourcesByType(type);
      let count = 0;
      resources.forEach(r => {
        if (r.pause) {
          r.pause();
          count++;
        }
      });
      emitter?.emit(RESOURCE_EVENT_NAMES.TYPE_PAUSED, { type, count });
      return count;
    },

    // Resume recursos por tipo
    resumeByType(type: string) {
      const resources = getResourcesByType(type);
      let count = 0;
      resources.forEach(r => {
        if (r.resume) {
          r.resume();
          count++;
        }
      });
      emitter?.emit(RESOURCE_EVENT_NAMES.TYPE_RESUMED, { type, count });
      return count;
    },

    // Pausa todos os recursos
    pauseAll() {
      const resources = getRegisteredResources();
      let count = 0;
      resources.forEach(r => {
        if (r.pause) {
          r.pause();
          count++;
        }
      });
      emitter?.emit(RESOURCE_EVENT_NAMES.ALL_PAUSED, { count });
      return count;
    },

    // Resume todos os recursos
    resumeAll() {
      const resources = getRegisteredResources();
      let count = 0;
      resources.forEach(r => {
        if (r.resume) {
          r.resume();
          count++;
        }
      });
      emitter?.emit(RESOURCE_EVENT_NAMES.ALL_RESUMED, { count });
      return count;
    },

    // Pausa recursos de um painel
    pausePanel(panelId: string) {
      const record = panelRegistry.get(panelId);
      if (!record) return 0;

      let count = 0;
      record.resources.forEach((info: Record<string, unknown>) => {
        if ((info.resource as Record<string, unknown>)?.pause) {
          ((info.resource as Record<string, (...args: unknown[]) => void>).pause)();
          count++;
        }
      });

      emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_PAUSED, { panelId, count });
      return count;
    },

    // Resume recursos de um painel
    resumePanel(panelId: string) {
      const record = panelRegistry.get(panelId);
      if (!record) return 0;

      let count = 0;
      record.resources.forEach((info: Record<string, unknown>) => {
        if ((info.resource as Record<string, unknown>)?.resume) {
          ((info.resource as Record<string, (...args: unknown[]) => void>).resume)();
          count++;
        }
      });

      emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_RESUMED, { panelId, count });
      return count;
    }
  };
}

export default { createPauseController };
