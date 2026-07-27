// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: linear
// PURPOSE: Keyboard Navigation Manager - Linear Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FOCUS_WRAP from ../constants.js
//
// PROVIDES:
//   _navigateLinear() — exported function
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

import { FOCUS_WRAP } from '../constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.keyboard-navigation-manager.navigation.linear';

export function _navigateLinear(items: unknown[], currentIndex: number, direction: number, wrap: unknown) {
  let newIndex: number = currentIndex + direction;

  if (wrap === FOCUS_WRAP.WRAP) {
    if (newIndex < 0) newIndex = items.length - 1;
    else if (newIndex >= items.length) newIndex = 0;
  } else if (wrap === FOCUS_WRAP.STOP) {
    newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
  } else {
    if (newIndex < 0 || newIndex >= items.length) return currentIndex;
  }
  
  return newIndex;
}
