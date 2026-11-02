// Context Module - Barrel Export
// DEPENDENCY CONTRACT (1.1.0-MODULAR) — BARREL FILE
// @version 1.1.0-MODULAR
'use strict';

export { MODULE_ID, VERSION, CONTEXT_STATES, PROGRESS_EVENTS } from './constants.js';
export { createStateStore } from './state-store.js';
export { createProgressTracker } from './progress-tracker.js';
export { createHealthCalculator } from './health-calculator.js';
export { createPhaseManager } from './phase-manager.js';
export { createFeatureChecker } from './feature-checker.js';
export { createSnapshotBuilder } from './snapshot-builder.js';
