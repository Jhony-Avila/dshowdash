// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Classify
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ERROR_TYPES, SEVERITY from ../constants.js
//
// PROVIDES:
//   classifyError() — exported function
//   determineSeverity() — exported function
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

import { ERROR_TYPES, SEVERITY } from '../constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.error-boundary.helpers.classify';

export function classifyError(error: DynObj, context: { type?: string; overlayId?: string; overlayType?: string; severity?: string; operation?: string } = {}) {
  if (context.type) return context.type;
  
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('render') || message.includes('dom')) return ERROR_TYPES.RENDER;
  if (message.includes('timeout') || message.includes('timed out')) return ERROR_TYPES.TIMEOUT;
  if (message.includes('network') || message.includes('fetch')) return ERROR_TYPES.NETWORK;
  if (message.includes('permission') || message.includes('denied')) return ERROR_TYPES.PERMISSION;
  if (message.includes('validation') || message.includes('invalid')) return ERROR_TYPES.VALIDATION;
  if (message.includes('state') || message.includes('undefined')) return ERROR_TYPES.STATE;
  if (message.includes('lifecycle') || message.includes('mount')) return ERROR_TYPES.LIFECYCLE;
  
  return ERROR_TYPES.UNKNOWN;
}

export function determineSeverity(errorType: DynObj, context: { severity?: string; overlayId?: string; overlayType?: string; operation?: string } = {}) {
  if (context.severity) return context.severity;
  
  switch (errorType) {
    case ERROR_TYPES.RENDER:
    case ERROR_TYPES.STATE:
      return SEVERITY.HIGH;
    case ERROR_TYPES.TIMEOUT:
    case ERROR_TYPES.NETWORK:
      return SEVERITY.MEDIUM;
    case ERROR_TYPES.VALIDATION:
    case ERROR_TYPES.PERMISSION:
      return SEVERITY.LOW;
    default:
      return SEVERITY.MEDIUM;
  }
}
