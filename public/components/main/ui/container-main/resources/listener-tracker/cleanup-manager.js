import { LISTENER_TYPES } from "./constants.js";
import { createLogger } from "../../utils/logger.js";
import { LISTENER_TRACKER_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.listener-tracker.cleanup-manager";
const logger = createLogger("container-main:listener-tracker:cleanup");
function createCleanupManager(options = {}) {
  const {
    panelRegistry,
    statsManager,
    emitter,
    onCleanup
  } = options;
  return {
    createRemover(panelId, listenerId, type, cleanupFn) {
      return () => {
        const registry = panelRegistry.get(panelId);
        if (!registry) return false;
        let collection;
        switch (type) {
          case LISTENER_TYPES.TIMER:
            collection = registry.timers;
            break;
          case LISTENER_TYPES.INTERVAL:
            collection = registry.intervals;
            break;
          case LISTENER_TYPES.OBSERVER:
            collection = registry.observers;
            break;
          case LISTENER_TYPES.RAF:
            collection = registry.rafs;
            break;
          default:
            collection = registry.listeners;
        }
        if (collection.has(listenerId)) {
          try {
            cleanupFn?.();
          } catch (e) {
            logger.warn("Error during cleanup", { listenerId, error: e.message });
          }
          collection.delete(listenerId);
          statsManager.incrementRemoved();
          return true;
        }
        return false;
      };
    },
    cleanupPanel(panelId) {
      const registry = panelRegistry.get(panelId);
      if (!registry) return 0;
      let cleaned = 0;
      registry.listeners.forEach(() => {
        cleaned++;
      });
      registry.listeners.clear();
      registry.timers.forEach((info) => {
        clearTimeout(info.timerId);
        cleaned++;
      });
      registry.timers.clear();
      registry.intervals.forEach((info) => {
        clearInterval(info.intervalId);
        cleaned++;
      });
      registry.intervals.clear();
      registry.rafs.forEach((info) => {
        cancelAnimationFrame(info.rafId);
        cleaned++;
      });
      registry.rafs.clear();
      registry.observers.clear();
      statsManager.incrementAutoCleanups(cleaned);
      onCleanup?.(panelId, cleaned);
      emitter?.emit(LISTENER_TRACKER_EVENT_NAMES.PANEL_CLEANUP, { panelId, cleaned });
      return cleaned;
    }
  };
}
var cleanup_manager_default = { createCleanupManager };
export {
  MODULE_ID,
  VERSION,
  createCleanupManager,
  cleanup_manager_default as default
};
