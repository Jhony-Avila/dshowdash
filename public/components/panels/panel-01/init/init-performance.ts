// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-performance
// PURPOSE: Panel-01 - Performance Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   initFeature, loadFeature from ./feature-loader.js
//   FeatureModules from ./feature-registry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
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

import { CONFIG } from '../core/config.js';
import { initFeature, loadFeature } from './feature-loader.js';
import { FeatureModules } from './feature-registry.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:init-performance';

export async function initPerformance(ctx: Record<string, unknown>, result: Record<string, unknown>) {
  const features: Record<string, unknown> = CONFIG.features || {};
  const toastModule = await loadFeature('toast', FeatureModules.toast);

  // Circuit Breaker
  const cbModule = await loadFeature('circuitBreaker', FeatureModules.circuitBreaker);
  if (cbModule) {
    const CircuitBreaker = (cbModule as Record<string, new (...args: unknown[]) => unknown>).CircuitBreaker;
    result.circuitBreaker = initFeature('circuitBreaker.init', () => new CircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 }), { fallback: null });
  }

  // Delta Updates
  if (features.deltaUpdates !== false) {
    const deltaModule = await loadFeature('deltaUpdates', FeatureModules.deltaUpdates);
    if (deltaModule && (deltaModule as Record<string, unknown>).DeltaUpdateManager) {
      const DeltaUpdateManager = (deltaModule as Record<string, new (...args: unknown[]) => unknown>).DeltaUpdateManager;
      result.deltaUpdates = initFeature('deltaUpdates.init', () => new DeltaUpdateManager({
        onInsert(items: unknown[]) {
          if (toastModule && (toastModule as Record<string, unknown>).info && items.length > 0) {
            (toastModule as Record<string, (msg: string) => void>).info(`${items.length} novos registros`);
          }
        },
        onUpdate(items: unknown[]) {},
        onDelete(ids: unknown[]) {}
      }), { fallback: null });
    }
  }

  // Smart Cache
  if (features.smartCache !== false) {
    const cacheModule = await loadFeature('smartCache', FeatureModules.smartCache);
    if (cacheModule && (cacheModule as Record<string, unknown>).SmartCache) {
      const SmartCache = (cacheModule as Record<string, new (...args: unknown[]) => unknown>).SmartCache;
      result.smartCache = initFeature('smartCache.init', () => new SmartCache({
        maxSize: 100,
        ttl: 5 * 60 * 1000,
        persist: true
      }), { fallback: null });
    }
  }

  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initPerformance, info };
