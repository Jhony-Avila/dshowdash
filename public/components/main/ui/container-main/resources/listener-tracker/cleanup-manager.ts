// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: cleanup-manager
// PURPOSE: Listener Cleanup Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LISTENER_TYPES from ./constants.js
//   createLogger from ../../utils/logger.js
//   LISTENER_TRACKER_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createCleanupManager() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LISTENER_TRACKER_EVENT_NAMES.PANEL_CLEANUP
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LISTENER_TYPES } from './constants.js';
import { createLogger } from '../../utils/logger.js';
import { LISTENER_TRACKER_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.listener-tracker.cleanup-manager';

const logger = createLogger('container-main:listener-tracker:cleanup');

export function createCleanupManager(options: Record<string, any> = {}) {
  const { 
    panelRegistry,
    statsManager,
    emitter,
    onCleanup
  } = options;

  return {
    createRemover(panelId: string, listenerId: unknown, type: string, cleanupFn: (...args: unknown[]) => void) {
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
          } catch (e: any) {
            logger.warn('Error during cleanup', { listenerId, error: e.message });
          }
          collection.delete(listenerId);
          statsManager.incrementRemoved();
          return true;
        }
        return false;
      };
    },

    cleanupPanel(panelId: string) {
      const registry = panelRegistry.get(panelId);
      if (!registry) return 0;

      let cleaned = 0;

      registry.listeners.forEach(() => { cleaned++; });
      registry.listeners.clear();

      registry.timers.forEach((info: Record<string, unknown>) => {
        clearTimeout(info.timerId as ReturnType<typeof setTimeout>);
        cleaned++;
      });
      registry.timers.clear();

      registry.intervals.forEach((info: Record<string, unknown>) => {
        clearInterval(info.intervalId as ReturnType<typeof setInterval>);
        cleaned++;
      });
      registry.intervals.clear();

      registry.rafs.forEach((info: Record<string, unknown>) => {
        cancelAnimationFrame(info.rafId as number);
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

export default { createCleanupManager };
