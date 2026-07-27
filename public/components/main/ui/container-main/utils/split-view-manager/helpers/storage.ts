// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: storage
// PURPOSE: Split View Manager - Storage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEY from ../constants.js
//   getConfig, isActive, getCurrentRatio, getCollapsedPanel from ../state.js
//   _log from ./logger.js
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
import { getConfig, isActive, getCurrentRatio, getCollapsedPanel } from '../state.js';
import { _log } from './logger.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.helpers.storage';

export function _saveState() {
  const config = getConfig();
  if (!config.persistState) return;
  try {
    const state = {
      isActive: isActive(),
      orientation: config.orientation,
      ratio: getCurrentRatio(),
      collapsedPanel: getCollapsedPanel()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e: any) {
    _log('warn', 'Failed to save state:', e.message);
  }
}

export function _loadState() {
  const config = getConfig();
  if (!config.persistState) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e: any) {
    return null;
  }
}
