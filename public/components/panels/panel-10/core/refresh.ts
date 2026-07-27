// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10-refresh
// PURPOSE: Panel-10 - Refresh Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED from ./constants.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   createRefreshManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED } from './constants.js';

export const MODULE_ID = 'panel-10-refresh';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function createRefreshManager(context: Record<string, unknown>) {
  const logger = context.logger as { debug: (event: string, data?: Record<string, unknown>) => void; info: (event: string, data?: Record<string, unknown>) => void };
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    start(instance: Record<string, unknown>, loadDataFn: () => Promise<void>) {
      this.stop();

      const tick = async () => {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }

        const interval = this.getInterval(instance);

        refreshTimer = setTimeout(async () => {
          if (!document.hidden && instance.mounted && !instance.destroyed) {
            logger.debug('refresh.tick', { interval });
            await loadDataFn();
          }
          tick();
        }, interval);
      };

      tick();
      logger.info('refresh.started', { interval: REFRESH_INTERVAL_BASE });
    },

    stop() {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
        logger.debug('refresh.stopped');
      }
    },

    getInterval(instance: Record<string, unknown>) {
      if (instance.isDegraded) return REFRESH_INTERVAL_DEGRADED;

      const conn = (navigator as any).connection;
      if (conn?.effectiveType) {
        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
          return REFRESH_INTERVAL_BASE * 4;
        }
        if (conn.effectiveType === '3g') {
          return REFRESH_INTERVAL_BASE * 2;
        }
      }

      return REFRESH_INTERVAL_BASE;
    },

    isRunning() {
      return refreshTimer !== null;
    }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { refreshReady: true } }; }

export default { createRefreshManager, MODULE_ID, VERSION, info, healthCheck };
