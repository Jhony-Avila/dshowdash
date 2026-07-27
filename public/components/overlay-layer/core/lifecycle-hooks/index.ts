// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lifecycle Hooks - Main Entry Point
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, HOOK_TYPES from ./constants.js
//   on, once, off, offAll from ./registration.js
//   execute, executeSync from ./execution.js
//   hasHooks, countHooks, listHooks, getHookTypes from ./queries.js
//   inject, configure, getConfig, enable, disable, isEnabled from ./config.js
//   getMetrics, resetMetrics, healthCheck, info from ./health.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   HOOK_TYPES — exported value
//   on — exported value
//   once — exported value
//   off — exported value
//   offAll — exported value
//   execute — exported value
//   executeSync — exported value
//   hasHooks — exported value
//   countHooks — exported value
//   listHooks — exported value
//   getHookTypes — exported value
//   inject — exported value
//   configure — exported value
//   getConfig — exported value
//   enable — exported value
//   disable — exported value
//   isEnabled — exported value
//   getMetrics — exported value
//   resetMetrics — exported value
//   healthCheck — exported value
//   info — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// Constants
export { VERSION, MODULE_ID, HOOK_TYPES } from './constants.js';

// Registration
export { on, once, off, offAll } from './registration.js';

// Execution
export { execute, executeSync } from './execution.js';

// Queries
export { hasHooks, countHooks, listHooks, getHookTypes } from './queries.js';

// Config
export { inject, configure, getConfig, enable, disable, isEnabled } from './config.js';

// Health
export { getMetrics, resetMetrics, healthCheck, info } from './health.js';

// Imports for default export
import { VERSION, MODULE_ID, HOOK_TYPES } from './constants.js';
import { on, once, off, offAll } from './registration.js';
import { execute, executeSync } from './execution.js';
import { hasHooks, countHooks, listHooks, getHookTypes } from './queries.js';
import { inject, configure, getConfig, enable, disable, isEnabled } from './config.js';
import { getMetrics, resetMetrics, healthCheck, info } from './health.js';

export default {
  inject,
  on,
  once,
  off,
  offAll,
  execute,
  executeSync,
  hasHooks,
  countHooks,
  listHooks,
  configure,
  getConfig,
  enable,
  disable,
  isEnabled,
  getHookTypes,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  HOOK_TYPES,
  VERSION,
  MODULE_ID
};
