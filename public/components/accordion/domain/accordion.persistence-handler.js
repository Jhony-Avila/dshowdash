import { ACCORDION_EVENTS } from "./accordion.constants.js";
import { LOADING_STATE } from "./accordion.contracts.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.domain.persistence-handler";
function createPersistenceHandler(deps) {
  const { stateManager, persistenceAdapter, metrics, emit } = deps;
  let persistDebounceTimer = null;
  const debouncedPersist = () => {
    if (persistDebounceTimer) {
      clearTimeout(persistDebounceTimer);
    }
    persistDebounceTimer = setTimeout(() => {
      persistState();
    }, 500);
  };
  const persistState = async () => {
    if (!persistenceAdapter) return { success: false, reason: "no_adapter" };
    try {
      const serialized = stateManager.serialize();
      await persistenceAdapter.save(serialized);
      emit(ACCORDION_EVENTS.PERSIST_OK, { timestamp: Date.now() });
      return { success: true };
    } catch (error) {
      metrics.errors++;
      emit(ACCORDION_EVENTS.PERSIST_FAIL, { error: error.message });
      return { success: false, error: error.message };
    }
  };
  const restoreState = async () => {
    if (!persistenceAdapter) return { success: false, reason: "no_adapter" };
    try {
      stateManager.setLoadingState(LOADING_STATE.RESTORING);
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
    } catch (error) {
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
function healthCheck() {
  const checks = {
    factoryAvailable: typeof createPersistenceHandler === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    handlers: ["debouncedPersist", "persistState", "restoreState", "clearDebounceTimer"],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var accordion_persistence_handler_default = {
  createPersistenceHandler,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createPersistenceHandler,
  accordion_persistence_handler_default as default,
  healthCheck,
  info
};
