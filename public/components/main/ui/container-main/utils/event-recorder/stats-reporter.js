import { VERSION, MODULE_ID } from "./constants.js";
function createStatsReporter(options = {}) {
  const { eventStore, getState } = options;
  return {
    // Estatísticas detalhadas
    getStats() {
      const events = eventStore.getEvents();
      const byType = {};
      const byName = {};
      for (const event of events) {
        byType[event.type] = (byType[event.type] || 0) + 1;
        byName[event.name] = (byName[event.name] || 0) + 1;
      }
      return {
        totalEvents: events.length,
        sessionId: eventStore.getSessionId(),
        duration: eventStore.getDuration(),
        byType,
        topEvents: Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }))
      };
    },
    // Health check
    healthCheck() {
      return {
        status: "HEALTHY",
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
    info(configOptions = {}) {
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
var stats_reporter_default = { createStatsReporter };
export {
  createStatsReporter,
  stats_reporter_default as default
};
