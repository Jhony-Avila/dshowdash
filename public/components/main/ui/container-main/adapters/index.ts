// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-PHASE4-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:adapters
// PURPOSE: Adapters - Barrel export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   healthCheck as globalStateHealth from ./global-state-adapter.js
//   healthCheck as eventBusHealth from ./event-bus-adapter.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ADAPTERS — exported value
//   adaptersHealthCheck() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   GlobalStateAdapter — exported value
//   EventBusAdapter — exported value
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

export const VERSION = '2.0.0-PHASE4';
export const MODULE_ID = 'container-main:adapters';

// FASE 1 - GlobalState
export * from './global-state-adapter.js';
export { default as GlobalStateAdapter } from './global-state-adapter.js';

// FASE 4 - EventBus
export * from './event-bus-adapter.js';
export { default as EventBusAdapter } from './event-bus-adapter.js';

// Lista de adapters
export const ADAPTERS = Object.freeze([
  'global-state-adapter',
  'event-bus-adapter'
]);

// Health check agregado
import { healthCheck as globalStateHealth } from './global-state-adapter.js';
import { healthCheck as eventBusHealth } from './event-bus-adapter.js';

export function adaptersHealthCheck() {
  return {
    globalState: globalStateHealth(),
    eventBus: eventBusHealth()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    adapters: ADAPTERS
  };
}

export function healthCheck() {
  const checks = adaptersHealthCheck();
  const allHealthy = Object.values(checks).every(c => c.status === 'HEALTHY' || c.status === 'NOT_INITIALIZED');
  return {
    status: allHealthy ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    adapters: checks
  };
}

export default { VERSION, MODULE_ID, ADAPTERS, adaptersHealthCheck, info, healthCheck };
