// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:bootstrap
// PURPOSE: Bootstrap States - Constantes de estado do bootstrap
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BOOTSTRAP_STATES — exported value
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

export const VERSION = '13.0.0-PHASE7';
export const MODULE_ID = 'container-main:bootstrap.config.states';

export const BOOTSTRAP_STATES = Object.freeze({
  IDLE: 'idle',
  BOOTING: 'booting',
  PHASE1_READY: 'phase1-ready',
  PHASE2_READY: 'phase2-ready',
  PHASE3_READY: 'phase3-ready',
  PHASE4_READY: 'phase4-ready',
  PHASE5_READY: 'phase5-ready',
  PHASE6_READY: 'phase6-ready',
  PHASE7_READY: 'phase7-ready',
  KERNEL_READY: 'kernel-ready',
  COMPONENTS_READY: 'components-ready',
  PLUGINS_READY: 'plugins-ready',
  RUNNING: 'running',
  ERROR: 'error',
  SHUTDOWN: 'shutdown'
});

export default { VERSION, MODULE_ID, BOOTSTRAP_STATES };
