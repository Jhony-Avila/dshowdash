// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: storage
// PURPOSE: Command Palette - Storage Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEY from ../constants.js
//   getConfig, getRecentCommands, setRecentCommands from ../state.js
//
// PROVIDES:
//   _saveState() — exported function
//   _loadState() — exported function
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

import { STORAGE_KEY } from '../constants.js';
import { getConfig, getRecentCommands, setRecentCommands } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.command-palette-manager.helpers.storage';

export function _saveState() {
  try {
    const config = getConfig();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      recentCommands: getRecentCommands().slice(0, config.maxRecentCommands)
    }));
  } catch (e) {}
}

export function _loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      setRecentCommands(data.recentCommands || []);
    }
  } catch (e) {}
}
