// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ELEVATION)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-kernel:runtime-integration
// PURPOSE: Runtime Integration - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   VALID_MODES — exported value
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

export const VERSION = '1.0.0-ELEVATION';
export const MODULE_ID = 'overlay-kernel:runtime-integration';

export const VALID_MODES = Object.freeze([
  'NORMAL',
  'DEGRADED',
  'MAINTENANCE',
  'RECOVERY',
  'FAILED',
  'INITIALIZING'
]);

export default {
  VERSION,
  MODULE_ID,
  VALID_MODES
};
