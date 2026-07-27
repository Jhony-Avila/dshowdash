// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Kernel Module - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   KERNEL_STATES — exported value
//   createStateMachine — exported value
//   createErrorHandler — exported value
//   createManagerRegistry — exported value
//   initializeSubsystems — exported value
//   CLEANUP_STRATEGIES — exported value
//   MEMORY_LIMITS — exported value
//   createHealthReporter — exported value
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

export { VERSION, MODULE_ID, KERNEL_STATES } from './constants.js';
export { createStateMachine } from './state-machine.js';
export { createErrorHandler } from './error-handler.js';
export { createManagerRegistry } from './manager-registry.js';
export { initializeSubsystems, CLEANUP_STRATEGIES, MEMORY_LIMITS } from './subsystem-initializer.js';
export { createHealthReporter } from './health-reporter.js';

export * from './facades/index.js';
