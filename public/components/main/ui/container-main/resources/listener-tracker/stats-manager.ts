// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: stats-manager
// PURPOSE: Listener Stats Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createStatsManager() — exported function
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

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.listener-tracker.stats-manager';

export function createStatsManager() {
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

export default { createStatsManager };
