// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: resource-facade
// PURPOSE: Resource Facade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getCircuitBreaker from ../../resources/circuit-breaker.js
//
// PROVIDES:
//   createResourceFacade() — exported function
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

import { getCircuitBreaker } from '../../resources/circuit-breaker.js';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.kernel.facades.resource-facade';

export function createResourceFacade(registry: { get: (name: string) => Record<string, (...args: unknown[]) => unknown> | null }) {
  return {
    scheduleCleanup(id: string, cleanupFn: (...args: unknown[]) => void, priority = 0) {
      return registry.get('cleanup')?.schedule(id, cleanupFn, priority) || false;
    },

    cancelCleanup(id: string) {
      return registry.get('cleanup')?.cancel(id) || false;
    },

    async executeProtected(fn: (...args: unknown[]) => void, breakerName = 'default') {
      const breaker = getCircuitBreaker(breakerName);
      return breaker.executeWithRetry(fn);
    },

    start() {
      registry.get('resource')?.start();
      registry.get('cleanup')?.start();
    },

    stop() {
      registry.get('cleanup')?.stop();
    },

    pauseAll() {
      registry.get('resource')?.pauseAll();
    },

    resumeAll() {
      registry.get('resource')?.resumeAll();
    }
  };
}

export default { createResourceFacade };
