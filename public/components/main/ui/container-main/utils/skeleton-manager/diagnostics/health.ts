// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health
// PURPOSE: Skeleton Manager - Health & Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, SKELETON_TYPES from ../constants.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID, SKELETON_TYPES } from '../constants.js';

// ============================================================================
// DIAGNOSTICS
// ============================================================================

/**
 * Info do módulo (standalone)
 * @returns {Object}
 */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    types: Object.keys(SKELETON_TYPES).map(k => (SKELETON_TYPES as Record<string, unknown>)[k])
  };
}

/**
 * Health check (standalone - sem instância)
 * @param {Object} instance
 * @returns {Object}
 */
export function healthCheck(instance: Record<string, unknown>) {
  if (instance && typeof instance.healthCheck === 'function') {
    return instance.healthCheck();
  }
  
  return {
    status: 'NOT_INITIALIZED',
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  info,
  healthCheck
};
