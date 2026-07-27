const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.listener-tracker.stats-manager";
function createStatsManager() {
  let _stats = {
    totalRegistered: 0,
    totalRemoved: 0,
    totalAutoCleanups: 0,
    leaksDetected: 0,
    warningsEmitted: 0
  };
  return {
    incrementRegistered() {
      _stats.totalRegistered++;
    },
    incrementRemoved() {
      _stats.totalRemoved++;
    },
    incrementAutoCleanups(count = 1) {
      _stats.totalAutoCleanups += count;
    },
    incrementLeaksDetected() {
      _stats.leaksDetected++;
    },
    incrementWarnings() {
      _stats.warningsEmitted++;
    },
    getStats() {
      return { ..._stats };
    },
    reset() {
      _stats = {
        totalRegistered: 0,
        totalRemoved: 0,
        totalAutoCleanups: 0,
        leaksDetected: 0,
        warningsEmitted: 0
      };
    }
  };
}
var stats_manager_default = { createStatsManager };
export {
  MODULE_ID,
  VERSION,
  createStatsManager,
  stats_manager_default as default
};
