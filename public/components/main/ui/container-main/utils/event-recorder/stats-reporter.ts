// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: stats-reporter
// PURPOSE: Event Recorder Stats Reporter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//
// PROVIDES:
//   createStatsReporter() — exported function
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

import { VERSION, MODULE_ID } from './constants.js';

export function createStatsReporter(options: Record<string, any> = {}) {
  const { eventStore, getState } = options;

  return {
    // Estatísticas detalhadas
    getStats() {
      const events = eventStore.getEvents();
      const byType: Record<string, any> = {};
      const byName: Record<string, any> = {};
      
      for (const event of events) {
        byType[event.type] = (byType[event.type] || 0) + 1;
        byName[event.name] = (byName[event.name] || 0) + 1;
      }

      return {
        totalEvents: events.length,
        sessionId: eventStore.getSessionId(),
        duration: eventStore.getDuration(),
        byType,
        topEvents: Object.entries(byName)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }))
      };
    },

    // Health check
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        state: getState(),
        eventCount: eventStore.getEventCount(),
        sessionId: eventStore.getSessionId(),
        maxEvents: eventStore.getMaxEvents(),
        modular: true
      };
    },

    // Info
    info(configOptions: Record<string, any> = {}) {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        maxEvents: eventStore.getMaxEvents(),
        captureEventBus: configOptions.captureEventBus,
        captureDOMEvents: configOptions.captureDOMEvents,
        captureNetworkEvents: configOptions.captureNetworkEvents,
        persistToStorage: configOptions.persistToStorage,
        modular: true
      };
    }
  };
}

export default { createStatsReporter };
