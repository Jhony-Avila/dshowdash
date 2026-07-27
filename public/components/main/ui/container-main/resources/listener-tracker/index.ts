// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Listener Tracker Module - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LISTENER_TYPES — exported value
//   DEFAULT_LIMITS — exported value
//   createPanelRegistry — exported value
//   createLimitChecker — exported value
//   createDOMTracker — exported value
//   createTimerTracker — exported value
//   createObserverTracker — exported value
//   createCleanupManager — exported value
//   createStatsManager — exported value
//   createLeakDetector — exported value
//   createQueryMethods — exported value
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

export { VERSION, MODULE_ID, LISTENER_TYPES, DEFAULT_LIMITS } from './constants.js';
export { createPanelRegistry } from './panel-registry.js';
export { createLimitChecker } from './limit-checker.js';
export { createDOMTracker } from './dom-tracker.js';
export { createTimerTracker } from './timer-tracker.js';
export { createObserverTracker } from './observer-tracker.js';
export { createCleanupManager } from './cleanup-manager.js';
export { createStatsManager } from './stats-manager.js';
export { createLeakDetector } from './leak-detector.js';
export { createQueryMethods } from './query-methods.js';
