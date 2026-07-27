// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Wrappers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ../state.js
//   capture from ./capture.js
//
// PROVIDES:
//   boundary() — exported function
//   boundarySync() — exported function
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

import { config } from '../state.js';
import { capture } from './capture.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.error-boundary.boundary.wrappers';

export function boundary(operation: DynObj, context: { fallback?: unknown; returnFallback?: boolean; rethrow?: boolean; operation?: string } = {}) {
  return async (...args: DynObj[]) => {
    try {
      const result = await operation(...args);
      return result;
    } catch (error) {
      const errorRecord = capture(error, context);
      
      if (context.fallback !== undefined) {
        return context.fallback;
      }
      
      if (config.fallbackContent !== null && context.returnFallback) {
        return { ok: false, error: errorRecord, fallback: config.fallbackContent };
      }
      
      if (context.rethrow) {
        throw error;
      }
      
      return { ok: false, error: errorRecord };
    }
  };
}

export function boundarySync(operation: DynObj, context: { fallback?: unknown; rethrow?: boolean } = {}) {
  return (...args: DynObj[]) => {
    try {
      return operation(...args);
    } catch (error) {
      const errorRecord = capture(error, context);
      
      if (context.fallback !== undefined) {
        return context.fallback;
      }
      
      if (context.rethrow) {
        throw error;
      }
      
      return { ok: false, error: errorRecord };
    }
  };
}
