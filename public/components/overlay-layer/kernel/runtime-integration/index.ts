// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Runtime Integration - Application Kernel Contract
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   init, shutdown from ./core/lifecycle.js
//   getMode, getRuntimeContext, isIntegrated, canOpenOverlay, getMetrics from ./core/queries.js
//   getAggregatedHealth, healthCheck, info from ./diagnostics/health.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init — exported value
//   shutdown — exported value
//   getMode — exported value
//   getRuntimeContext — exported value
//   isIntegrated — exported value
//   canOpenOverlay — exported value
//   getMetrics — exported value
//   getAggregatedHealth — exported value
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

// ============================================================================
// IMPORTS
// ============================================================================

import { VERSION, MODULE_ID } from './constants.js';
import { init, shutdown } from './core/lifecycle.js';
import { getMode, getRuntimeContext, isIntegrated, canOpenOverlay, getMetrics } from './core/queries.js';
import { getAggregatedHealth, healthCheck, info } from './diagnostics/health.js';

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { VERSION, MODULE_ID };

// Lifecycle
export { init, shutdown };

// Queries
export { getMode, getRuntimeContext, isIntegrated, canOpenOverlay, getMetrics };

// Diagnostics
export { getAggregatedHealth, healthCheck, info };

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  VERSION,
  MODULE_ID,
  init,
  shutdown,
  getMode,
  getRuntimeContext,
  isIntegrated,
  canOpenOverlay,
  getMetrics,
  getAggregatedHealth,
  healthCheck,
  info
};
