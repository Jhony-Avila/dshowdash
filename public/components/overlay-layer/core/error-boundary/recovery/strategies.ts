// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Recovery Strategies
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ERROR_TYPES from ../constants.js
//   recoveryStrategies from ../state.js
//
// PROVIDES:
//   registerRecoveryStrategy() — exported function
//   removeRecoveryStrategy() — exported function
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

import { ERROR_TYPES } from '../constants.js';
import { recoveryStrategies } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.error-boundary.recovery.strategies';

export function registerRecoveryStrategy(errorType: DynObj, strategy: DynObj) {
  if (!(ERROR_TYPES as DynObj)[errorType] && !Object.values(ERROR_TYPES).includes(errorType)) {
    return { ok: false, error: 'invalid-error-type' };
  }
  
  if (typeof strategy !== 'function') {
    return { ok: false, error: 'strategy-must-be-function' };
  }
  
  (recoveryStrategies as DynObj)[errorType] = strategy;
  
  return { ok: true, errorType };
}

export function removeRecoveryStrategy(errorType: DynObj) {
  delete (recoveryStrategies as DynObj)[errorType];
  return { ok: true };
}
