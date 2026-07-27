// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-SPRINT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Features Toolbar - Helpers Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   resetThrottles — exported value
//   setupKeyboardNavigation — exported value
//   _createButton — exported value
//   _createGroup — exported value
//   _createDropdown — exported value
//   _createOverflowButton — exported value
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
export const MODULE_ID = 'main.ui.container-main.utils.features-toolbar.helpers';

export {
  resetThrottles,
  setupKeyboardNavigation,
  _createButton,
  _createGroup,
  _createDropdown,
  _createOverflowButton
} from './dom.js';
