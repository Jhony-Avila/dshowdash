// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/_shared
// PURPOSE: Panels Shared - Main Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   healthCheck() — exported function
//   info() — exported function
//   LifecycleManager — exported value
//   createLifecycleManager — exported value
//   CircuitBreaker — exported value
//   createCircuitBreaker — exported value
//   StateStore — exported value
//   createStore — exported value
//   Logger — exported value
//   createLogger — exported value
//   Tracker — exported value
//   createTracker — exported value
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/_shared';

export { LifecycleManager, createLifecycleManager } from './core/lifecycle.js';
export { CircuitBreaker, createCircuitBreaker } from './core/circuit-breaker.js';
export { StateStore, createStore } from './state/store.js';

// @ts-expect-error TS migration - TS2614
export { Logger, createLogger } from './telemetry/logger.js';

// @ts-expect-error TS migration - TS2614
export { Tracker, createTracker } from './telemetry/tracker.js';

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    modules: ['lifecycle', 'circuit-breaker', 'store', 'logger', 'tracker'],
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['LifecycleManager', 'CircuitBreaker', 'StateStore', 'Logger', 'Tracker'],
    modules: ['lifecycle', 'circuit-breaker', 'store', 'logger', 'tracker'],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  healthCheck,
  info
};
