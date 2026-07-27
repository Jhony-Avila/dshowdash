// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:adaptive-kernel
// PURPOSE: Kernel Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   KERNEL_STATES — exported value
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

export const VERSION = '10.0.0-INTEGRATED';
export const MODULE_ID = 'container-main:adaptive-kernel';

// Estados do kernel
export const KERNEL_STATES = Object.freeze({
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  READY: 'ready',
  RUNNING: 'running',
  PAUSED: 'paused',
  ERROR: 'error',
  RESETTING: 'resetting',
  DESTROYED: 'destroyed'
});

export default { VERSION, MODULE_ID, KERNEL_STATES };
