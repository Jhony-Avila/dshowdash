// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:capability-manager
// PURPOSE: Stats Reporter - Estatísticas e health do Capability Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CAPABILITY_STATUS from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { CAPABILITY_STATUS } from './constants.js';

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:capability-manager';

export function createStatsReporter(options: Record<string, any> = {}) {
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

      store.getAllPanels().forEach((record: Map<string, Record<string, unknown>>) => {
        record.forEach((state: Record<string, unknown>, cap: string) => {
          if (!(stats.byCapability as Record<string, Record<string, number>>)[cap]) {
            (stats.byCapability as Record<string, Record<string, number>>)[cap] = { granted: 0, denied: 0, revoked: 0 };
          }

          if (state.status === CAPABILITY_STATUS.GRANTED) {
            stats.totalGranted++;
            (stats.byCapability as Record<string, Record<string, number>>)[cap].granted++;
          } else if (state.status === CAPABILITY_STATUS.DENIED) {
            stats.totalDenied++;
            (stats.byCapability as Record<string, Record<string, number>>)[cap].denied++;
          } else if (state.status === CAPABILITY_STATUS.REVOKED) {
            stats.totalRevoked++;
            (stats.byCapability as Record<string, Record<string, number>>)[cap].revoked++;
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
        status: destroyed ? 'DESTROYED' : 'HEALTHY',
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

export default { createStatsReporter, VERSION, MODULE_ID };
