// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Bootstrap Phases - Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   initPhase1 — exported value
//   initPhase2 — exported value
//   initPhase3 — exported value
//   initPhase4 — exported value
//   initPhase5 — exported value
//   initPhase6 — exported value
//   initPhase7 — exported value
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.phases';

export { initPhase1 } from './phase1-foundation.js';
export { initPhase2 } from './phase2-performance.js';
export { initPhase3 } from './phase3-core.js';
export { initPhase4 } from './phase4-plugins.js';
export { initPhase5 } from './phase5-utils.js';
export { initPhase6 } from './phase6-ui.js';
export { initPhase7 } from './phase7-device.js';
