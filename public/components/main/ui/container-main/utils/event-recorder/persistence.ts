// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: persistence
// PURPOSE: Event Recorder Persistence
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createPersistence() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.event-recorder.persistence';

export function createPersistence(options: Record<string, any> = {}) {
  const { 
    eventStore, 
    storageKey = 'cm-event-recorder',
    enabled = false,
    logger 
  } = options;

  return {
    // Persiste no storage
    save() {
      if (!enabled || typeof localStorage === 'undefined') return false;
      
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          sessionId: eventStore.getSessionId(),
          startTime: eventStore.getStartTime(),
          events: eventStore.getLastEvents(500)
        }));
        return true;
      } catch (e) {
        logger?.warn('Failed to persist events:', e);
        return false;
      }
    },

    // Carrega do storage
    load() {
      if (!enabled || typeof localStorage === 'undefined') return false;
      
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          eventStore.setSessionId(data.sessionId);
          eventStore.setStartTime(data.startTime);
          eventStore.setEvents(data.events || []);
          logger?.info(`Loaded ${data.events?.length || 0} events from storage`);
          return true;
        }
        return false;
      } catch (e) {
        logger?.warn('Failed to load events from storage:', e);
        return false;
      }
    },

    // Remove do storage
    clear() {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(storageKey);
    },

    // Verifica se está habilitado
    isEnabled() {
      return enabled;
    }
  };
}

export default { createPersistence };
