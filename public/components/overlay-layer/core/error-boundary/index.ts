// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, ERROR_TYPES, SEVERITY from ./constants.js
//   inject from ./helpers/logger.js
//   capture from ./boundary/capture.js
//   boundary, boundarySync from ./boundary/wrappers.js
//   registerRecoveryStrategy, removeRecoveryStrategy from ./recovery/strategies.js
//   getErrors, getErrorsByType, getErrorsBySeverity, getUnrecoveredErrors, getLastError from ./queries.js
//   clearError, clearErrors, cleanExpired, onError, clearHandlers from ./operations.js
//   getStats, configure, getConfig, healthCheck, info from ./api.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ERROR_TYPES — exported value
//   SEVERITY — exported value
//   inject — exported value
//   capture — exported value
//   boundary — exported value
//   boundarySync — exported value
//   registerRecoveryStrategy — exported value
//   removeRecoveryStrategy — exported value
//   getErrors — exported value
//   getErrorsByType — exported value
//   getErrorsBySeverity — exported value
//   getUnrecoveredErrors — exported value
//   getLastError — exported value
//   clearError — exported value
//   clearErrors — exported value
//   cleanExpired — exported value
//   onError — exported value
//   clearHandlers — exported value
//   getStats — exported value
//   configure — exported value
//   getConfig — exported value
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

export { VERSION, MODULE_ID, ERROR_TYPES, SEVERITY } from './constants.js';
export { inject } from './helpers/logger.js';
export { capture } from './boundary/capture.js';
export { boundary, boundarySync } from './boundary/wrappers.js';
export { registerRecoveryStrategy, removeRecoveryStrategy } from './recovery/strategies.js';
export { getErrors, getErrorsByType, getErrorsBySeverity, getUnrecoveredErrors, getLastError } from './queries.js';
export { clearError, clearErrors, cleanExpired, onError, clearHandlers } from './operations.js';
export { getStats, configure, getConfig, healthCheck, info } from './api.js';

import { VERSION, MODULE_ID, ERROR_TYPES, SEVERITY } from './constants.js';
import { inject } from './helpers/logger.js';
import { capture } from './boundary/capture.js';
import { boundary, boundarySync } from './boundary/wrappers.js';
import { registerRecoveryStrategy, removeRecoveryStrategy } from './recovery/strategies.js';
import { getErrors, getErrorsByType, getErrorsBySeverity, getUnrecoveredErrors, getLastError } from './queries.js';
import { clearError, clearErrors, cleanExpired, onError, clearHandlers } from './operations.js';
import { getStats, configure, getConfig, healthCheck, info } from './api.js';

export default {
  inject,
  capture,
  registerRecoveryStrategy,
  removeRecoveryStrategy,
  onError,
  clearHandlers,
  boundary,
  boundarySync,
  getErrors,
  getErrorsByType,
  getErrorsBySeverity,
  getUnrecoveredErrors,
  getLastError,
  clearError,
  clearErrors,
  cleanExpired,
  getStats,
  configure,
  getConfig,
  healthCheck,
  info,
  ERROR_TYPES,
  SEVERITY,
  VERSION,
  MODULE_ID
};
