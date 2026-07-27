// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10-status
// PURPOSE: Panel-10 - Enterprise Status
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PAINEL_ID, VERSION as PANEL_VERSION, MAX_CONSECUTIVE_ERRORS from ../core/cons...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createStatusManager() — exported function
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

import { PAINEL_ID, VERSION as PANEL_VERSION, MAX_CONSECUTIVE_ERRORS } from '../core/constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-10-status';

export function createStatusManager(getInstance: () => Record<string, unknown> | null) {
  return {
    getStatus() {
      const instance = getInstance();
      if (!instance) return { panelId: PAINEL_ID, mounted: false };
      const apiClient = instance.apiClient as { getMetrics?: () => Record<string, unknown> } | undefined;
      const circuitBreaker = instance.circuitBreaker as { getMetrics?: () => Record<string, unknown> } | undefined;
      const store = instance.store as { getStats?: () => Record<string, unknown> } | undefined;
      return { panelId: PAINEL_ID, version: PANEL_VERSION, state: instance.state, mounted: instance.mounted, destroyed: instance.destroyed, isDegraded: instance.isDegraded, consecutiveErrors: instance.consecutiveErrors, loadCount: instance.loadCount, lastLoadTime: instance.lastLoadTime, metrics: { ...(instance.performanceMetrics as Record<string, unknown>) }, api: apiClient?.getMetrics?.() || {}, circuitBreaker: circuitBreaker?.getMetrics?.() || {}, store: store?.getStats?.() || {} };
    },

    healthCheck() {
      const status = this.getStatus();
      const instance = getInstance();
      // @ts-expect-error strict migration — TS2365
      const checks = { instanceExists: !!instance, mounted: status.mounted === true, notDestroyed: status.destroyed !== true, notDegraded: status.isDegraded !== true, lowErrorCount: (status.consecutiveErrors || 0) < MAX_CONSECUTIVE_ERRORS, circuitClosed: status.circuitBreaker?.state === 'CLOSED' };
      const score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return { status: score === maxScore ? 'HEALTHY' : score >= 4 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, panelId: PAINEL_ID, version: VERSION, timestamp: Date.now() };
    },

    // @ts-expect-error strict migration — TS2783
    info() { return { panelId: PAINEL_ID, version: VERSION, moduleId: MODULE_ID, ...this.getStatus() }; },
    getVersion() { return VERSION; }
  };
}

export default { createStatusManager, MODULE_ID, VERSION };
