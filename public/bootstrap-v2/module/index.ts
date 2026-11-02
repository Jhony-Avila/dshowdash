// Bootstrap-V2 Module - Main Barrel Export
// @version 2.7.1-CONTRACTS
// @changelog v2.7.1-CONTRACTS: Dependency Contract formalizado
// @changelog v2.7.0-QUALITY: Sprint 5 - #1 Persistência, #4 Histórico, #20 Debug Unificado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.7.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   ./constants.js, ./configs/index.js, ./utils/index.js,
//   ./boot-loop/index.js, ./global-timeout/index.js,
//   ./singleton/index.js, ./phases/index.js, ./boot/index.js,
//   ./periodic-health/index.js, ./getters/index.js,
//   ./diagnostics/index.js, ./lifecycle/index.js,
//   ./persistence/index.js, ./debug-mode.js
// PROVIDES: Re-exports all module sub-systems (barrel)
// WINDOW ACCESS: None (delegated to sub-modules)
// ═══════════════════════════════════════════════════════════════
'use strict';

// Constants
export { VERSION, MODULE_ID, SINGLETON_KEY, SINGLETON_STATES } from './constants.js';

// Configs
export { BOOT_LOOP_CONFIG, GLOBAL_TIMEOUT_CONFIG, PERIODIC_HEALTH_CONFIG } from './configs/index.js';

// Utils
export { log, logInfo, logWarn, logError, deepClone } from './utils/index.js';

// Boot Loop
export { checkBootLoop, getBootLoopStatus, resetBootLoopStatus } from './boot-loop/index.js';

// Global Timeout
export { createGlobalTimeout } from './global-timeout/index.js';

// Singleton
export { initSingletonState, getSingletonState, setSingletonState, resetSingletonState } from './singleton/index.js';

// Phases
export { PHASE_MAP, CONFIG_KEY_MAP, registerPhases, getPhaseIds } from './phases/index.js';

// Boot
export { createPhaseStartHandler, createPhaseCompleteHandler, createBootExecutor } from './boot/index.js';

// Periodic Health
export { startPeriodicHealthCheck, stopPeriodicHealthCheck } from './periodic-health/index.js';

// Getters
export { createCoreGetters, createContextGetters, createHealthGetters, createSystemGetters, createStatusGetters } from './getters/index.js';

// Diagnostics
export { createHealthCheck, createInfoReporter } from './diagnostics/index.js';

// Lifecycle
export { createResetManager } from './lifecycle/index.js';

// Sprint 5: #1 + #4 - Persistência e Histórico de Boots
export {
  saveCurrentBoot,
  getCurrentBoot,
  getLastSuccessfulBoot,
  hasRecentValidBoot,
  clearCurrentBoot,
  addToHistory,
  getHistory,
  clearHistory,
  analyzeHistory
} from './persistence/index.js';

// Sprint 5: #20 - Debug Mode Unificado
export {
  enable as enableDebug,
  disable as disableDebug,
  toggle as toggleDebug,
  isEnabled as isDebugEnabled,
  getState as getDebugState,
  log as debugLog,
  measure as debugMeasure,
  measureAsync as debugMeasureAsync
} from './debug-mode.js';

// Re-export modules para acesso direto
export * as BootPersistence from './persistence/index.js';
export * as DebugMode from './debug-mode.js';
