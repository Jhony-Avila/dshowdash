// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-FIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-domain
// PURPOSE: Main Domain - Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   healthCheck() — exported function
//   info() — exported function
//   createActionHub — exported value
//   ActionHub — exported value
//   createAuditModule — exported value
//   createObservabilityModule — exported value
//   createPersistenceAdapter — exported value
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

// Core Controllers
export * from './context-builder.js';
export * from './state-machine.js';
export * from './navigation-controller/index.js';
export * from './panel-lifecycle-controller.js';
export * from './multi-container-orchestrator.js';
export * from './error-supervisor.js';

// manifest-controller: getPorts/injectPorts excluded (duplicate with navigation-controller)
export {
  createManifestController,
  MANIFEST_TELEMETRY,
  registerManifest,
  getManifest,
  getAllManifests,
  listManifests,
  loadManifest,
  isLoaded,
  getLoadedManifests,
  unregisterManifest
} from './manifest-controller.js';
export * from './layout-controller.js';
export * from './canvas-controller-enterprise.js';

// timeline-controller: getMetrics excluded (duplicate with context-builder)
export {
  createTimelineController,
  addEvent,
  getEvents,
  clearEvents
} from './timeline-controller.js';
export * from './orchestrator-controller.js';
export * from './globalstate-controller-v2.js';

// container-orchestration-policy: getMetrics excluded (duplicate with context-builder)
export {
  createContainerOrchestrationPolicy,
  DOCK_MODES,
  OPEN_STRATEGIES,
  getPolicy,
  setPolicy,
  resetPolicy,
  checkPolicy
} from './container-orchestration-policy.js';

// canvas-lifecycle-controller: getMetrics excluded (duplicate with context-builder)
export {
  create,
  destroy,
  activate,
  getActive,
  get,
  getAll,
  clear
} from './canvas-lifecycle-controller.js';
export * from './flow-controller.js';

// Main Engine (modular)
export * from './main-engine.js';

// Sub-modules (re-export principais)

export { createActionHub } from './action-hub/index.js';
export { default as ActionHub } from './action-hub/index.js';
export { createAuditModule } from './audit/index.js';
export { createObservabilityModule } from './observability/index.js';
export { createPersistenceAdapter } from './persistence/index.js';

export const VERSION = '8.2.0-FIX';
export const MODULE_ID = 'main-domain';

const DOMAIN_MODULES = [
  'context-builder',
  'state-machine',
  'navigation-controller',
  'panel-lifecycle-controller',
  'multi-container-orchestrator',
  'error-supervisor',
  'manifest-controller',
  'layout-controller',
  'canvas-controller-enterprise',
  'timeline-controller',
  'orchestrator-controller',
  'globalstate-controller-v2',
  'container-orchestration-policy',
  'canvas-lifecycle-controller',
  'flow-controller',
  'main-engine',
  'action-hub',
  'audit',
  'observability',
  'persistence'
];

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    modules: DOMAIN_MODULES,
    moduleCount: DOMAIN_MODULES.length
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    modules: DOMAIN_MODULES,
    moduleCount: DOMAIN_MODULES.length
  };
}

export default { VERSION, MODULE_ID, healthCheck, info, DOMAIN_MODULES };
