import {
  getRegisteredResources,
  getResourcesByType
} from "../../contracts/resource-contract.js";
import { RESOURCE_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "2.1.0-EVENT-CONSTANTS";
const MODULE_ID = "main.ui.container-main.resources.resource-manager.pause-controller";
function createPauseController(options = {}) {
  const { panelRegistry, emitter } = options;
  return {
    // Pausa recursos por tipo
    pauseByType(type) {
      const resources = getResourcesByType(type);
      let count = 0;
      resources.forEach((r) => {
        if (r.pause) {
          r.pause();
          count++;
        }
      });
      emitter?.emit(RESOURCE_EVENT_NAMES.TYPE_PAUSED, { type, count });
      return count;
    },
    // Resume recursos por tipo
    resumeByType(type) {
      const resources = getResourcesByType(type);
      let count = 0;
      resources.forEach((r) => {
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
      resources.forEach((r) => {
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
      resources.forEach((r) => {
        if (r.resume) {
          r.resume();
          count++;
        }
      });
      emitter?.emit(RESOURCE_EVENT_NAMES.ALL_RESUMED, { count });
      return count;
    },
    // Pausa recursos de um painel
    pausePanel(panelId) {
      const record = panelRegistry.get(panelId);
      if (!record) return 0;
      let count = 0;
      record.resources.forEach((info) => {
        if (info.resource?.pause) {
          info.resource.pause();
          count++;
        }
      });
      emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_PAUSED, { panelId, count });
      return count;
    },
    // Resume recursos de um painel
    resumePanel(panelId) {
      const record = panelRegistry.get(panelId);
      if (!record) return 0;
      let count = 0;
      record.resources.forEach((info) => {
        if (info.resource?.resume) {
          info.resource.resume();
          count++;
        }
      });
      emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_RESUMED, { panelId, count });
      return count;
    }
  };
}
var pause_controller_default = { createPauseController };
export {
  MODULE_ID,
  VERSION,
  createPauseController,
  pause_controller_default as default
};
