// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:panel-bookmarks
// PURPOSE: Panel Bookmarks Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BOOKMARK_TYPES — exported value
//   SORT_MODES — exported value
//   DEFAULT_CONFIG — exported value
//   STORAGE_KEY — exported value
//   RECENT_KEY — exported value
//   FREQUENCY_KEY — exported value
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

export const VERSION = '1.0.0';
export const MODULE_ID = 'container-main:panel-bookmarks';

export const BOOKMARK_TYPES = Object.freeze({
  PANEL: 'panel',
  STATE: 'state',
  SHORTCUT: 'shortcut'
});

export const SORT_MODES = Object.freeze({
  MANUAL: 'manual',
  ALPHABETICAL: 'alphabetical',
  RECENT: 'recent',
  FREQUENCY: 'frequency'
});

export const DEFAULT_CONFIG = Object.freeze({
  maxBookmarks: 50,
  maxRecentPanels: 10,
  persistBookmarks: true,
  trackFrequency: true,
  enableHotkeys: true,
  hotkeyPrefix: 'alt',
  sortMode: SORT_MODES.MANUAL,
  showNotifications: true
});

export const STORAGE_KEY = 'dsd:container-main:bookmarks';
export const RECENT_KEY = 'dsd:container-main:recent-panels';
export const FREQUENCY_KEY = 'dsd:container-main:panel-frequency';
