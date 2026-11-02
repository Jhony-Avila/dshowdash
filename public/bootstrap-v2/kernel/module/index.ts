// Kernel Module - Main Barrel Export
// DEPENDENCY CONTRACT (1.2.0-MODULAR) — BARREL FILE
// @version 1.2.0-MODULAR
'use strict';

export { MODULE_ID, VERSION, SINGLETON_KEY } from './constants-local.js';
export { createLogger, createEmitter, createModeHistoryManager } from './utils/index.js';
export { setupCircuitBreakerIntegration, createCircuitBreakerHandlers, createCircuitBreakerAPI } from './circuit-breaker/index.js';
export { setupStateMachineSync, createStateMachineSyncHandlers, createStateMachineSyncAPI } from './state-machine-sync/index.js';
export { createModeManager, createModeQueries } from './mode/index.js';
export { createHealthManager } from './health/index.js';
export { createStateSnapshotManager } from './state/index.js';
export { createSubscriptionManager } from './subscriptions/index.js';
export { createInitializer, createResetter } from './lifecycle/index.js';
export { createInfoReporter, createHealthChecker } from './diagnostics/index.js';
export { getInstance, resetInstance, hasInstance } from './singleton/index.js';
