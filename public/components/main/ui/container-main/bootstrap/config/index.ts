// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Bootstrap Config - Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BOOTSTRAP_STATES — exported value
//   CONFIG_SCHEMA — exported value
//   DEFAULT_CONFIG — exported value
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

export { VERSION, MODULE_ID, BOOTSTRAP_STATES } from './states.js';
export { CONFIG_SCHEMA, DEFAULT_CONFIG } from './defaults.js';
