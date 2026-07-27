import { CAPABILITY_STATUS } from "./constants.js";
const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:capability-manager";
function createStatsReporter(options = {}) {
  const { store, validator, platformConfig, isDestroyed } = options;
  return {
    // Obtém estatísticas
    getStats() {
      const stats = {
        totalPanels: store.getPanelCount(),
        totalGranted: 0,
        totalDenied: 0,
        totalRevoked: 0,
        byCapability: {},
        activeCounts: store.getActiveCapabilityCounts()
      };
      store.getAllPanels().forEach((record) => {
        record.forEach((state, cap) => {
          if (!stats.byCapability[cap]) {
            stats.byCapability[cap] = { granted: 0, denied: 0, revoked: 0 };
          }
          if (state.status === CAPABILITY_STATUS.GRANTED) {
            stats.totalGranted++;
            stats.byCapability[cap].granted++;
          } else if (state.status === CAPABILITY_STATUS.DENIED) {
            stats.totalDenied++;
            stats.byCapability[cap].denied++;
          } else if (state.status === CAPABILITY_STATUS.REVOKED) {
            stats.totalRevoked++;
            stats.byCapability[cap].revoked++;
          }
        });
      });
      return stats;
    },
    // Obtém histórico de requests
    getHistory(limit = 100) {
      return store.getHistory(limit);
    },
    // Health check
    healthCheck() {
      const stats = this.getStats();
      const destroyed = isDestroyed?.() || false;
      return {
        status: destroyed ? "DESTROYED" : "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        policy: validator.getPolicy(),
        stats,
        platformCapabilities: Object.keys(platformConfig || {}).length,
        registeredPanels: store.getPanelCount()
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        policy: validator.getPolicy(),
        registeredPanels: store.getPanelCount(),
        platformCapabilities: Object.keys(platformConfig || {})
      };
    }
  };
}
var stats_reporter_default = { createStatsReporter, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createStatsReporter,
  stats_reporter_default as default
};
