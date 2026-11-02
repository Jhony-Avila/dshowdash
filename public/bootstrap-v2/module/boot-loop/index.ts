// Boot Loop - Barrel Export
// DEPENDENCY CONTRACT (2.6.0-MODULAR) — BARREL FILE
// @version 2.6.0-MODULAR
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.boot-loop';

export { getTracker, saveTracker, resetTracker } from './tracker.js';
export { checkBootLoop } from './detector.js';
export { getBootLoopStatus, resetBootLoopStatus } from './status.js';
