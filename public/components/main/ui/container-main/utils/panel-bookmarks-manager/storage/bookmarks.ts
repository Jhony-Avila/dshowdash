// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: bookmarks
// PURPOSE: Panel Bookmarks Manager - Bookmarks Storage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEY from ../constants.js
//   getConfig, getBookmarks from ../state.js
//   log from ../helpers/logger.js
//
// PROVIDES:
//   saveBookmarks() — exported function
//   loadBookmarks() — exported function
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
import { getConfig, getBookmarks } from '../state.js';
import { log } from '../helpers/logger.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.storage.bookmarks';

export function saveBookmarks() {
  const config = getConfig();
  if (!config.persistBookmarks) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getBookmarks()));
  } catch (e: any) {
    log('warn', 'Failed to save bookmarks:', e.message);
  }
}

export function loadBookmarks() {
  const config = getConfig();
  if (!config.persistBookmarks) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e: any) {
    return [];
  }
}
