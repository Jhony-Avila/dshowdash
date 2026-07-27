// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-adapters
// PURPOSE: Container Adapters - Index Unificado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   healthCheck() — exported function
//   info() — exported function
//   createContainerAdapter — exported value
//   createContainerElement — exported value
//   initDOMFactory — exported value
//   ensureDockSlots — exported value
//   getSlotElement — exported value
//   createStateMachine — exported value
//   createTransactionManager — exported value
//   createRecoveryManager — exported value
//   createLifecycleManager — exported value
//   createStateActions — exported value
//   createFeaturesBridge — exported value
//   createManagement — exported value
//   validateVariant — exported value
//   debounce — exported value
//   throttle — exported value
//   generateId — exported value
//   ... and 10 more exports
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

// Core adapter
export { createContainerAdapter } from './adapter.js';

// Módulos de suporte existentes
export { createContainerElement, initDOMFactory, ensureDockSlots, getSlotElement } from './dom-factory.js';
export { createStateMachine } from './state-machine.js';
export { createTransactionManager } from './transactions.js';
export { createRecoveryManager } from './recovery.js';

// Novos módulos especializados
export { createLifecycleManager } from './lifecycle.js';
export { createStateActions } from './state-actions.js';
export { createFeaturesBridge } from './features-bridge.js';
export { createManagement } from './management.js';

// Helpers e constantes
export { validateVariant, debounce, throttle, generateId, deepClone } from './helpers.js';
export { 
  STATE, POLICY, DOCK_SLOTS, LAYOUT_MODE, BUDGET, ENTERPRISE_DEFAULTS,
  CONTAINER_STATES, CONTAINER_EVENTS, CONTAINER_CONFIG 
} from './constants.js';

// Estado interno (para casos especiais)
export * as internalState from './internal-state.js';

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-adapters';

const MODULES = [
  'adapter', 'dom-factory', 'state-machine', 'transactions', 'recovery',
  'lifecycle', 'state-actions', 'features-bridge', 'management',
  'helpers', 'constants', 'internal-state'
];

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, modules: MODULES };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, modules: MODULES, healthCheck: healthCheck(), timestamp: Date.now() };
}

export default { VERSION, MODULE_ID, healthCheck, info };
