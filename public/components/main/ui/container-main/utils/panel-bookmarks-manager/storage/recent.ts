// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: recent
// PURPOSE: Panel Bookmarks Manager - Recent Storage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RECENT_KEY from ../constants.js
//
// PROVIDES:
//   saveRecentPanels() — exported function
//   loadRecentPanels() — exported function
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

import { RECENT_KEY } from '../constants.js';
import { getRecentPanels as getRecentPanelsState } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.storage.recent';

export function saveRecentPanels() {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(getRecentPanelsState()));
  } catch (e) {}
}

export function loadRecentPanels() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
