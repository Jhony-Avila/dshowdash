// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Navigation History - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getInstance() — exported function
//   setInstance() — exported function
//   hasInstance() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.navigation-history.state';

let _instance: Record<string, unknown> | null = null;

export function getInstance() { return _instance; }
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }
export function hasInstance() { return _instance !== null; }
