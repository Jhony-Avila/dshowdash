// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.domain.persistence-handler
// PURPOSE: Persistence handlers for accordion state
// ───────────────────────────────────────────────────────────────
// @contract CREATE_PERSISTENCE_HANDLER - createPersistenceHandler(deps) factory
// @contract DEBOUNCED_PERSIST - Debounced persist handler
// @contract PERSIST_STATE - Persist state handler
// @contract RESTORE_STATE - Restore state handler
// @contract CLEAR_DEBOUNCE_TIMER - Clear timer handler
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: ACCORDION_EVENTS from ./accordion.constants.js
// IMPORTS: LOADING_STATE from ./accordion.contracts.js
// PROVIDES: createPersistenceHandler, healthCheck, info, VERSION, MODULE_ID
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial persistence handler
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ACCORDION_EVENTS } from './accordion.constants.js';
import { LOADING_STATE } from './accordion.contracts.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.domain.persistence-handler';

export function createPersistenceHandler(deps: { stateManager: any; persistenceAdapter: { save?: (data: string) => Promise<unknown>; load?: () => Promise<string | null> } | null; metrics: Record<string, number>; emit: (event: string, data: Record<string, unknown>) => void }) {
  const { stateManager, persistenceAdapter, metrics, emit } = deps;

  let persistDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const debouncedPersist = () => {
    if (persistDebounceTimer) {
      clearTimeout(persistDebounceTimer);
    }
    persistDebounceTimer = setTimeout(() => {
      persistState();
    }, 500);
  };

  const persistState = async () => {
    if (!persistenceAdapter) return { success: false, reason: 'no_adapter' };

    try {
      const serialized = stateManager.serialize();
      // @ts-expect-error strict migration — TS2722
      await persistenceAdapter.save(serialized);
      emit(ACCORDION_EVENTS.PERSIST_OK, { timestamp: Date.now() });
      return { success: true };
    } catch (error: any) {
      metrics.errors++;
      emit(ACCORDION_EVENTS.PERSIST_FAIL, { error: error.message });
      return { success: false, error: error.message };
    }
  };

  const restoreState = async () => {
    if (!persistenceAdapter) return { success: false, reason: 'no_adapter' };

    try {
      stateManager.setLoadingState(LOADING_STATE.RESTORING);
      // @ts-expect-error strict migration — TS2722, TS18048
      const serialized = await persistenceAdapter.load();

      if (!serialized) {
        stateManager.setLoadingState(LOADING_STATE.READY);
        return { success: true, restored: false };
      }

      const result = stateManager.restore(serialized);

      if (result.success) {
        emit(ACCORDION_EVENTS.RESTORE_OK, { timestamp: Date.now() });
      } else {
        emit(ACCORDION_EVENTS.RESTORE_FAIL, { error: result.error });
      }

      stateManager.setLoadingState(LOADING_STATE.READY);
      return result;
    } catch (error: any) {
      metrics.errors++;
      stateManager.setLoadingState(LOADING_STATE.READY);
      emit(ACCORDION_EVENTS.RESTORE_FAIL, { error: error.message });
      return { success: false, error: error.message };
    }
  };

  const clearDebounceTimer = () => {
    if (persistDebounceTimer) {
      clearTimeout(persistDebounceTimer);
      persistDebounceTimer = null;
    }
  };

  return {
    debouncedPersist,
    persistState,
    restoreState,
    clearDebounceTimer
  };
}

export function healthCheck() {
  const checks = {
    factoryAvailable: typeof createPersistenceHandler === 'function'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    handlers: ['debouncedPersist', 'persistState', 'restoreState', 'clearDebounceTimer'],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  createPersistenceHandler,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
