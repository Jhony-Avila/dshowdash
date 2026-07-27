// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sorting
// PURPOSE: Panel Bookmarks Manager - Sorting
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SORT_MODES from ../constants.js
//   getConfig from ../state.js
//
// PROVIDES:
//   sortBookmarks() — exported function
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

import { SORT_MODES } from '../constants.js';
import { getConfig } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.helpers.sorting';

export function sortBookmarks(bookmarks: unknown) {
  const config = getConfig();
  switch (config.sortMode as string) {
    case SORT_MODES.ALPHABETICAL:
      // @ts-expect-error TS migration - TS2488
      return [...bookmarks].sort((a, b) => (a.title || a.panelId).localeCompare(b.title || b.panelId));
    case SORT_MODES.RECENT:
      // @ts-expect-error TS migration - TS2488
      return [...bookmarks].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    case SORT_MODES.FREQUENCY:
      // @ts-expect-error TS migration - TS2488
      return [...bookmarks].sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
    case SORT_MODES.MANUAL:
    default:
      // @ts-expect-error TS migration - TS2488
      return [...bookmarks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}
