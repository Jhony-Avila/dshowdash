// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Queries
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   errors, state from ./state.js
//
// PROVIDES:
//   getErrors() — exported function
//   getErrorsByType() — exported function
//   getErrorsBySeverity() — exported function
//   getUnrecoveredErrors() — exported function
//   getLastError() — exported function
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

import { errors, state } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.error-boundary.queries';

export function getErrors(limit = 20) {
  return errors.slice(-limit).reverse();
}

export function getErrorsByType(type: DynObj) {
  return errors.filter(e => e.type === type);
}

export function getErrorsBySeverity(severity: DynObj) {
  return errors.filter(e => e.severity === severity);
}

export function getUnrecoveredErrors() {
  return errors.filter(e => !e.recovered);
}

export function getLastError() {
  return state.lastError;
}
