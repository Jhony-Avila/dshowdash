// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: observability.contracts
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   OBSERVABILITY_EVENTS — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
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

export const OBSERVABILITY_EVENTS = Object.freeze({
  // Request/Response pattern
  METRICS_REQUEST: 'observability.metrics.request',
  METRICS: 'observability.metrics',
  HEALTH_REQUEST: 'observability.health.request',
  HEALTH: 'observability.health'
});

export const VERSION = '1.0.0-P18EC';
export const MODULE_ID = 'observability.contracts';

export default { VERSION, MODULE_ID, OBSERVABILITY_EVENTS };
