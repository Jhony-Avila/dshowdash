// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.0.0-SPRINT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Features Toolbar - UI Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   _buildToolbar — exported value
//   _appendDynamicGroup — exported value
//   _updateButtonStates — exported value
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
export const MODULE_ID = 'main.ui.container-main.utils.features-toolbar.ui';

export { _buildToolbar, _appendDynamicGroup } from './builder.js';
export { _updateButtonStates } from './state-updater.js';
