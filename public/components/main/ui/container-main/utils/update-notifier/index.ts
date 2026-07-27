// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, NOTIFIER_STATES, UPDATE_TYPES from ./constants.js
//   createUpdateNotifier from ./manager.js
//   getUpdateNotifier, resetUpdateNotifier, checkForUpdates, hasUpdate from ./sta...
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   NOTIFIER_STATES — exported value
//   UPDATE_TYPES — exported value
//   createUpdateNotifier — exported value
//   getUpdateNotifier — exported value
//   resetUpdateNotifier — exported value
//   checkForUpdates — exported value
//   hasUpdate — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Update Notifier - Main Entry Point
 * @module update-notifier
 * @version 1.0.0-AAA
 * @description Detecta e notifica quando nova versão está disponível (#26) - Modularizado
 */
'use strict';

// Constants
export { VERSION, MODULE_ID, NOTIFIER_STATES, UPDATE_TYPES } from './constants.js';

// Factory
export { createUpdateNotifier } from './manager.js';

// Singleton
export { getUpdateNotifier, resetUpdateNotifier, checkForUpdates, hasUpdate } from './state.js';

// Import for utilities and default export
import { VERSION, MODULE_ID, NOTIFIER_STATES, UPDATE_TYPES } from './constants.js';
import { createUpdateNotifier } from './manager.js';
import { getUpdateNotifier, resetUpdateNotifier, checkForUpdates, hasUpdate } from './state.js';

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  const instance = getUpdateNotifier();
  if (instance) return (instance.healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION,
  MODULE_ID,
  NOTIFIER_STATES,
  UPDATE_TYPES,
  createUpdateNotifier,
  getUpdateNotifier,
  resetUpdateNotifier,
  checkForUpdates,
  hasUpdate,
  info,
  healthCheck
};
