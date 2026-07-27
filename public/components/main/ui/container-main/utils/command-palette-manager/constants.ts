// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:command-palette
// PURPOSE: Command Palette - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   COMMAND_TYPES — exported value
//   PALETTE_MODES — exported value
//   DEFAULT_CONFIG — exported value
//   STORAGE_KEY — exported value
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
export const MODULE_ID = 'container-main:command-palette';

export const COMMAND_TYPES = Object.freeze({
  ACTION: 'action',
  NAVIGATION: 'navigation',
  SETTING: 'setting',
  RECENT: 'recent',
  SEARCH: 'search'
});

export const PALETTE_MODES = Object.freeze({
  COMMANDS: 'commands',
  SEARCH: 'search',
  GOTO: 'goto',
  SETTINGS: 'settings'
});

export const DEFAULT_CONFIG = Object.freeze({
  hotkey: 'ctrl+k',
  placeholder: 'Digite um comando ou busque...',
  maxResults: 10,
  maxRecentCommands: 5,
  showIcons: true,
  showShortcuts: true,
  showCategories: true,
  fuzzySearch: true,
  highlightMatches: true,
  closeOnSelect: true,
  closeOnEscape: true,
  closeOnClickOutside: true,
  animationDuration: 150,
  debounceDelay: 100
});

export const STORAGE_KEY = 'dsd:container-main:command-palette';
