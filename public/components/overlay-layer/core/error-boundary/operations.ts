// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, errors, errorHandlers, setErrors, setErrorHandlers from ./state.js
//
// PROVIDES:
//   clearError() — exported function
//   clearErrors() — exported function
//   cleanExpired() — exported function
//   onError() — exported function
//   clearHandlers() — exported function
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

import { config, errors, errorHandlers, setErrors, setErrorHandlers } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.error-boundary.operations';

export function clearError(errorId: string) {
  const index = errors.findIndex(e => e.id === errorId);
  if (index === -1) return { ok: false, error: 'not-found' };
  
  errors.splice(index, 1);
  return { ok: true };
}

export function clearErrors() {
  const count = errors.length;
  setErrors([]);
  return { ok: true, cleared: count };
}

export function cleanExpired() {
  const now = Date.now();
  const before = errors.length;
  
  const filtered = errors.filter(e => (now - e.timestamp) < config.errorTTL);
  setErrors(filtered);
  
  return { ok: true, removed: before - filtered.length };
}

export function onError(handler: DynObj) {
  if (typeof handler !== 'function') {
    throw new Error('Handler must be a function');
  }
  
  errorHandlers.push(handler);
  
  return () => {
    const index = errorHandlers.indexOf(handler);
    if (index > -1) {
      errorHandlers.splice(index, 1);
    }
  };
}

export function clearHandlers() {
  setErrorHandlers([]);
  return { ok: true };
}
