// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.9.0-SPRINT6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Bootstrap Integration - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BOOTSTRAP_STATES — exported value
//   CONFIG_SCHEMA — exported value
//   DEFAULT_CONFIG — exported value
//   createManagerRegistry — exported value
//   initPhase1 — exported value
//   initPhase2 — exported value
//   initPhase3 — exported value
//   initPhase4 — exported value
//   initPhase5 — exported value
//   initPhase6 — exported value
//   initPhase7 — exported value
//   createHealthReporter — exported value
//   createGetters — exported value
//   createConvenienceMethods — exported value
//   exposeGlobals — exported value
//   clearGlobals — exported value
//   getInstance — exported value
//   resetInstance — exported value
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

// Core exports
export { VERSION, MODULE_ID, BOOTSTRAP_STATES, CONFIG_SCHEMA, DEFAULT_CONFIG } from './constants.js';
export { createManagerRegistry } from './manager-registry.js';
export { initPhase1, initPhase2, initPhase3, initPhase4, initPhase5, initPhase6, initPhase7 } from './phase-initializers/index.js';
export { createHealthReporter } from './health-reporter.js';
export { createGetters } from './getters.js';
export { createConvenienceMethods } from './convenience-methods.js';

// New modular exports
export { exposeGlobals, clearGlobals } from './globals/expose-globals.js';
export { getInstance, resetInstance, hasInstance, info as singletonInfo, healthCheck as singletonHealthCheck } from './singleton/instance.js';

// Re-export sprint imports for convenience
export * from './globals/sprint-imports.js';
