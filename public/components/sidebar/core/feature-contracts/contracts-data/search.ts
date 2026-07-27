// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-contracts-search
// PURPOSE: Sidebar Feature Contracts - Search Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CATEGORIES from ../categories.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   SEARCH_CONTRACTS — exported value
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

import { CATEGORIES } from '../categories.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'sidebar-contracts-search';
export const VERSION = '1.2.0-ES6';

export const SEARCH_CONTRACTS = {
  search: {
    module: 'fuzzy-search',
    version: '5.0.0',
    category: CATEGORIES.SEARCH,
    methods: {
      fuzzy: { original: 'applyFuzzySearch', args: ['container', 'query'], returns: 'array', requiresEl: true },
      highlight: { original: 'highlightMatches', altModule: 'highlight-matches', args: ['query'], returns: 'number' },
      clearHighlights: { original: 'clearHighlights', altModule: 'highlight-matches', args: [] as DynObj[], returns: 'void' },
      navigate: { original: 'navigateToMatch', altModule: 'highlight-matches', args: ['direction'], returns: 'void' },
      matchCount: { original: 'getMatchCount', altModule: 'highlight-matches', args: [] as DynObj[], returns: 'number' }
    },
    legacyMethods: {
      fuzzySearch: 'fuzzy', highlightMatches: 'highlight',
      clearHighlights: 'clearHighlights', navigateToMatch: 'navigate', getMatchCount: 'matchCount'
    }
  },

  commands: {
    module: 'command-palette',
    version: '5.0.0',
    category: CATEGORIES.SEARCH,
    methods: {
      show: { original: 'show', args: [] as DynObj[], returns: 'void' },
      hide: { original: 'hide', args: [] as DynObj[], returns: 'void' },
      toggle: { original: 'toggle', args: [] as DynObj[], returns: 'void' },
      register: { original: 'registerCommand', args: ['command'], returns: 'object' }
    },
    legacyMethods: {
      showCommandPalette: 'show', hideCommandPalette: 'hide',
      toggleCommandPalette: 'toggle', registerCommand: 'register'
    }
  }
};

export default SEARCH_CONTRACTS;
