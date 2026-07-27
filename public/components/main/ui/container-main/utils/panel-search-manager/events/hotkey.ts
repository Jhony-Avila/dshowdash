// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: hotkey
// PURPOSE: Panel Search Manager - Hotkey
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig from ../state.js
//   toggle from ../api.js
//
// PROVIDES:
//   _setupGlobalHotkey() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getConfig } from '../state.js';
import { toggle } from '../api.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-search-manager.events.hotkey';

export function _setupGlobalHotkey() {
  const config = getConfig();
  const [modifier, key] = config.hotkey.split('+');
  
  document.addEventListener('keydown', (e) => {
    const modifierPressed = {
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    }[modifier];
    
    if (modifierPressed && e.key.toLowerCase() === key.toLowerCase()) {
      e.preventDefault();
      toggle();
    }
  });
}
