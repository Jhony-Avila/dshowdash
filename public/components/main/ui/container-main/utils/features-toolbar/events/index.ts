// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.0.0-SPRINT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Features Toolbar - Events Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   _setupEventListeners — exported value
//   resetRewireState — exported value
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
export const MODULE_ID = 'main.ui.container-main.utils.features-toolbar.events';

export { _setupEventListeners, resetRewireState } from './listeners.js';
