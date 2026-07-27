// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:panel-search
// PURPOSE: Panel Search Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SEARCH_MODES — exported value
//   MATCH_TYPES — exported value
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
export const MODULE_ID = 'container-main:panel-search';

export const SEARCH_MODES = Object.freeze({
  TEXT: 'text',
  REGEX: 'regex',
  FUZZY: 'fuzzy'
});

export const MATCH_TYPES = Object.freeze({
  EXACT: 'exact',
  CASE_INSENSITIVE: 'case-insensitive',
  WORD_BOUNDARY: 'word-boundary'
});

export const DEFAULT_CONFIG = Object.freeze({
  hotkey: 'ctrl+f',
  mode: SEARCH_MODES.TEXT,
  matchType: MATCH_TYPES.CASE_INSENSITIVE,
  highlightColor: 'rgba(139, 92, 246, 0.4)',
  activeHighlightColor: 'rgba(139, 92, 246, 0.8)',
  minQueryLength: 2,
  maxResults: 500,
  debounceDelay: 150,
  scrollBehavior: 'smooth',
  showResultCount: true,
  showNavigation: true,
  persistLastSearch: true,
  excludeSelectors: ['script', 'style', 'noscript', '.dsd-no-search']
});

export const STORAGE_KEY = 'dsd:container-main:panel-search';
