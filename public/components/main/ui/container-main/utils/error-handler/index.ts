// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Error Handler Module - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ERROR_SEVERITY — exported value
//   ERROR_CATEGORIES — exported value
//   RECOVERY_ACTIONS — exported value
//   MAX_ERROR_LOG — exported value
//   classifyCategory — exported value
//   classifySeverity — exported value
//   suggestRecovery — exported value
//   createErrorStore — exported value
//   createMetricsTracker — exported value
//   createGlobalInstaller — exported value
//   createWrappers — exported value
//   createComponentBoundaryFactory — exported value
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

export { VERSION, MODULE_ID, ERROR_SEVERITY, ERROR_CATEGORIES, RECOVERY_ACTIONS, MAX_ERROR_LOG } from './constants.js';
export { classifyCategory, classifySeverity, suggestRecovery } from './classifier.js';
export { createErrorStore } from './error-store.js';
export { createMetricsTracker } from './metrics-tracker.js';
export { createGlobalInstaller } from './global-installer.js';
export { createWrappers } from './wrappers.js';
export { createComponentBoundaryFactory } from './component-boundary.js';
