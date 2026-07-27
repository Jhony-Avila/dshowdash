// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: storage
// PURPOSE: Panel Search Manager - Storage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEY from ../constants.js
//   getConfig, getCurrentQuery from ../state.js
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
import { getConfig, getCurrentQuery } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-search-manager.helpers.storage';

export function _saveState() {
  const config = getConfig();
  if (!config.persistLastSearch) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastQuery: getCurrentQuery() }));
  } catch (e) {}
}

export function _loadState() {
  const config = getConfig();
  if (!config.persistLastSearch) return '';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.lastQuery || '';
    }
  } catch (e) {}
  return '';
}
