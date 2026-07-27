// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: storage
// PURPOSE: Accessibility Manager - Storage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEY from ../constants.js
//   getConfig, getUserPreferences from ../state.js
//   _log from ./logger.js
//
// PROVIDES:
//   _savePreferences() — exported function
//   _loadPreferences() — exported function
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
import { getConfig, getUserPreferences } from '../state.js';
import { _log } from './logger.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.accessibility-manager.helpers.storage';

export function _savePreferences() {
  const config = getConfig();
  if (!config.persistPreferences) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getUserPreferences()));
  } catch (e: any) {
    _log('warn', 'Failed to save preferences:', e.message);
  }
}

export function _loadPreferences() {
  const config = getConfig();
  if (!config.persistPreferences) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e: any) {
    return {};
  }
}
