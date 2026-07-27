// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Record
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   classifyError, determineSeverity from ./classify.js
//
// PROVIDES:
//   createErrorRecord() — exported function
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

import { classifyError, determineSeverity } from './classify.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.error-boundary.helpers.record';

export function createErrorRecord(error: DynObj, context: { overlayId?: string; overlayType?: string; severity?: string; operation?: string } = {}) {
  const errorType = classifyError(error, context);
  const severity = determineSeverity(errorType, context);
  
  return {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: errorType,
    severity,
    message: error?.message || String(error),
    stack: error?.stack || null,
    context: {
      overlayId: context.overlayId || null,
      overlayType: context.overlayType || null,
      operation: context.operation || null,
      ...context
    },
    timestamp: Date.now(),
    recovered: false,
    recoveryAttempts: 0
  };
}
