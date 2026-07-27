// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.1.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Phase Initializers - Barrel Export
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
export const MODULE_ID = 'main.ui.container-main.bootstrap-integration.phase-initializers';

export { initPhase1 } from './phase-1.js';
export { initPhase2 } from './phase-2.js';
export { initPhase3 } from './phase-3.js';
export { initPhase4 } from './phase-4.js';
export { initPhase5 } from './phase-5.js';
export { initPhase6 } from './phase-6.js';
export { initPhase7 } from './phase-7.js';
