// Phase Executor - Barrel Export
// DEPENDENCY CONTRACT (3.2.0-ROLLBACK) — BARREL FILE
// @version 3.2.0-ROLLBACK
// @changelog v3.2.0-ROLLBACK: Sprint 6 #8 - Adicionado sistema de rollback automático
'use strict';

export { MODULE_ID, VERSION, DEFAULT_CIRCUIT_BREAKER_CONFIG } from './constants.js';
export { createHelpers, captureMemory, calculateMemoryDelta } from './utils/index.js';
export { createConfigResolver } from './manifest/index.js';
export { createBreakerManager, createExecutionGuard } from './circuit-breaker/index.js';
export { createPhaseMetrics } from './metrics/index.js';
export {
  createDependencyChecker, createSuccessHandler, createSuppressionHandler,
  createErrorHandler, createSkipHandler, createPhaseRunner
} from './execution/index.js';
export { createPublicAPI } from './api/index.js';

// Sprint 6 #8: Rollback Automático
export { createRollbackRegistry, createRollbackExecutor, EFFECT_TYPES } from './rollback/index.js';
