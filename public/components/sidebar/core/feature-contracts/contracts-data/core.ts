// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-contracts-core
// PURPOSE: Sidebar Feature Contracts - Core Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CATEGORIES from ../categories.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   CORE_CONTRACTS — exported value
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


export const MODULE_ID = 'sidebar-contracts-core';
export const VERSION = '1.2.0-ES6';

export const CORE_CONTRACTS = {
  favorites: {
    module: 'favorites-handler',
    version: '5.8.0',
    category: CATEGORIES.CORE,
    methods: {
      add: { original: 'addFavorite', args: ['itemId'], returns: 'boolean' },
      remove: { original: 'removeFavorite', args: ['itemId'], returns: 'boolean' },
      toggle: { original: 'toggleFavorite', args: ['itemId'], returns: 'boolean|null' },
      has: { original: 'isFavorite', args: ['itemId'], returns: 'boolean' },
      list: { original: 'getFavorites', args: [] as DynObj[], returns: 'array' },
      clear: { original: 'clearFavorites', args: [] as DynObj[], returns: 'void' },
      mark: { original: 'markFavoriteItems', args: ['container?'], returns: 'void', requiresEl: true }
    },
    legacyMethods: {
      addFavorite: 'add', removeFavorite: 'remove', toggleFavorite: 'toggle',
      isFavorite: 'has', getFavorites: 'list', clearFavorites: 'clear', markFavoriteItems: 'mark'
    }
  },

  config: {
    module: 'config-manager',
    version: '5.0.0',
    category: CATEGORIES.CORE,
    methods: {
      export: { original: 'exportConfig', args: [] as DynObj[], returns: 'object' },
      import: { original: 'importConfig', args: ['config'], returns: 'boolean' },
      reset: { original: 'resetConfig', args: [] as DynObj[], returns: 'void' },
      summary: { original: 'getConfigSummary', args: [] as DynObj[], returns: 'object' }
    },
    legacyMethods: {
      exportConfig: 'export', importConfig: 'import', resetConfig: 'reset', getConfigSummary: 'summary'
    }
  },

  flags: {
    module: 'feature-flags',
    version: '5.0.0',
    category: CATEGORIES.CORE,
    methods: {
      isEnabled: { original: 'isEnabled', args: ['key'], returns: 'boolean' },
      enable: { original: 'enable', args: ['key'], returns: 'void' },
      disable: { original: 'disable', args: ['key'], returns: 'void' },
      toggle: { original: 'toggle', args: ['key'], returns: 'boolean' },
      list: { original: 'getAll', args: [] as DynObj[], returns: 'object' },
      reset: { original: 'reset', args: [] as DynObj[], returns: 'void' }
    },
    legacyMethods: {
      isFeatureEnabled: 'isEnabled', enableFeature: 'enable', disableFeature: 'disable',
      toggleFeature: 'toggle', getAllFeatures: 'list', resetFeatures: 'reset'
    }
  }
};

export default CORE_CONTRACTS;
