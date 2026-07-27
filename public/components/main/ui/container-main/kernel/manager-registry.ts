// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: manager-registry
// PURPOSE: Kernel Manager Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   createManagerRegistry() — exported function
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
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.kernel.manager-registry';

import { createLogger } from '../utils/logger.js';

const logger = createLogger('container-main:manager-registry');

export function createManagerRegistry() {
  const _managers = {
    slot: null as HTMLElement | null,
    resource: null as Record<string, unknown> | null,
    // @ts-expect-error strict migration — TS2352
    cleanup: null as (...args: unknown[]) => void | null,
    capability: null as string | null,
    // @ts-expect-error strict migration — TS2352
    listener: null as (...args: unknown[]) => void | null,
    lifecycle: null as Record<string, unknown> | null,
    layout: null as Record<string, unknown> | null,
    metrics: null as Record<string, unknown> | null,
    image: null as HTMLImageElement | null,
    deprecation: null as Record<string, unknown> | null,
    compat: null as Record<string, unknown> | null
  };

  const _initTimes: Record<string, unknown> = {};

  return {
    async initManager(name: string, createFn: () => Record<string, unknown>) {
      const startTime = performance.now();
      try {
        const manager = createFn();
        if (typeof manager.init === 'function') await (manager.init as () => Promise<void>)();
        _initTimes[name] = performance.now() - startTime;
        (_managers as Record<string, unknown>)[name] = manager;
        return manager;
      } catch (error) {
        _initTimes[name] = -1;
        throw error;
      }
    },

    get(name: string) {
      return (_managers as Record<string, unknown>)[name] || null;
    },

    set(name: string, manager: unknown) {
      (_managers as Record<string, unknown>)[name] = manager;
    },

    has(name: string) {
      return (_managers as Record<string, unknown>)[name] !== null;
    },

    getAll() {
      return { ..._managers };
    },

    getInitTimes() {
      return { ..._initTimes };
    },

    listActive() {
      return Object.entries(_managers)
        .filter(([_, v]) => v !== null)
        .map(([k, v]) => {
          const mgr = v as Record<string, unknown>;
          return {
            name: k,
            version: (mgr.VERSION as string) || (typeof mgr.info === 'function' ? ((mgr.info as () => Record<string, unknown>)()?.version as string) : null) || 'unknown',
            healthy: typeof mgr.healthCheck === 'function' ? ((mgr.healthCheck as () => Record<string, unknown>)()?.status === 'HEALTHY') : false
          };
        });
    },

    async cleanup() {
      const cleanupOrder = [
        'cleanup', 'image', 'layout', 'metrics', 
        'listener', 'capability', 'lifecycle', 
        'resource', 'slot', 'deprecation', 'compat'
      ];

      const errors = [];
      for (const name of cleanupOrder) {
        try {
          if ((_managers as Record<string, unknown>)[name]) {
            const mgr = (_managers as Record<string, unknown>)[name] as Record<string, unknown>;
            if (typeof mgr.destroy === 'function') {
              await (mgr.destroy as () => Promise<void>)();
            }
            (_managers as Record<string, unknown>)[name] = null;
          }
        } catch (e: any) {
          errors.push({ name, error: e.message });
          logger.warn(`Error cleaning up ${name}`, { error: e.message });
        }
      }
      return errors;
    },

    reset() {
      for (const key of Object.keys(_managers)) {
        (_managers as Record<string, unknown>)[key] = null;
      }
    }
  };
}

export default { createManagerRegistry };
