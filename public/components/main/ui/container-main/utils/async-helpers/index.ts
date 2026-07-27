// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:async-helpers
// PURPOSE: Async Helpers - Operações assíncronas com timeout obrigatório
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_TIMEOUTS from ./constants.js
//   getActiveCount from ./abort-controller.js
//   getMetrics as getMetricsBase, healthCheck as healthCheckBase from ./metrics.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   DEFAULT_TIMEOUTS — exported value
//   createAbortController — exported value
//   abortByKey — exported value
//   abortAll — exported value
//   isActive — exported value
//   getActiveCount — exported value
//   getActiveKeys — exported value
//   withTimeout — exported value
//   executeWithTimeout — exported value
//   withAbortAndTimeout — exported value
//   fetchWithTimeout — exported value
//   fetchWithAbort — exported value
//   retryWithBackoff — exported value
//   delay — exported value
//   createDebouncedAsync — exported value
//   raceWithAbort — exported value
//   ... and 3 more exports
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

// Re-exports de todos os módulos
export { DEFAULT_TIMEOUTS } from './constants.js';
export { 
  createAbortController, 
  abortByKey, 
  abortAll, 
  isActive, 
  getActiveCount, 
  getActiveKeys 
} from './abort-controller.js';
export { 
  withTimeout, 
  executeWithTimeout, 
  withAbortAndTimeout 
} from './timeout.js';
export { 
  fetchWithTimeout, 
  fetchWithAbort 
} from './fetch.js';
export { 
  retryWithBackoff 
} from './retry.js';
export { 
  delay, 
  createDebouncedAsync, 
  raceWithAbort, 
  parallelLimit 
} from './utils.js';
export { 
  getMetrics, 
  resetMetrics 
} from './metrics.js';

// Imports para funções compostas
import { DEFAULT_TIMEOUTS } from './constants.js';
import { getActiveCount } from './abort-controller.js';
import { getMetrics as getMetricsBase, healthCheck as healthCheckBase } from './metrics.js';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:async-helpers';

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    defaultTimeouts: DEFAULT_TIMEOUTS,
    activeControllers: getActiveCount(),
    metrics: getMetricsBase(getActiveCount()),
    submodules: [
      'constants',
      'metrics',
      'abort-controller',
      'timeout',
      'fetch',
      'retry',
      'utils'
    ]
  };
}

export function healthCheck() {
  return healthCheckBase(getActiveCount());
}

export default {
  VERSION, MODULE_ID, DEFAULT_TIMEOUTS,
  info, healthCheck
};
