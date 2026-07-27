// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-contracts-ui
// PURPOSE: Sidebar Feature Contracts - UI Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CATEGORIES from ../categories.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   UI_CONTRACTS — exported value
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


export const MODULE_ID = 'sidebar-contracts-ui';
export const VERSION = '1.3.0-ES6';

export const UI_CONTRACTS = {
  theme: {
    module: 'theme-handler',
    version: '5.0.0',
    category: CATEGORIES.UI,
    methods: {
      set: { original: 'setTheme', args: ['theme', 'container?'], returns: 'void', requiresEl: true },
      get: { original: 'getTheme', args: [] as DynObj[], returns: 'string' },
      toggle: { original: 'toggleTheme', args: ['container?'], returns: 'string', requiresEl: true },
      list: { original: 'getAvailableThemes', args: [] as DynObj[], returns: 'array' },
      auto: { original: 'enable', altModule: 'auto-theme', args: ['container?'], returns: 'void', requiresEl: true },
      disableAuto: { original: 'disable', altModule: 'auto-theme', args: [] as DynObj[], returns: 'void' }
    },
    legacyMethods: {
      setTheme: 'set', getTheme: 'get', toggleTheme: 'toggle',
      getAvailableThemes: 'list', enableAutoTheme: 'auto', disableAutoTheme: 'disableAuto'
    }
  },

  layout: {
    module: 'compact-mode',
    version: '5.0.0',
    category: CATEGORIES.UI,
    methods: {
      compact: { original: 'enable', args: ['container?'], returns: 'void', requiresEl: true },
      disableCompact: { original: 'disable', args: ['container?'], returns: 'void', requiresEl: true },
      toggleCompact: { original: 'toggle', args: ['container?'], returns: 'boolean', requiresEl: true },
      mini: { original: 'enable', altModule: 'mini-mode', args: ['container?'], returns: 'void', requiresEl: true },
      disableMini: { original: 'disable', altModule: 'mini-mode', args: ['container?'], returns: 'void', requiresEl: true },
      toggleMini: { original: 'toggle', altModule: 'mini-mode', args: ['container?'], returns: 'boolean', requiresEl: true }
    },
    legacyMethods: {
      enableCompactMode: 'compact', disableCompactMode: 'disableCompact', toggleCompactMode: 'toggleCompact',
      enableMiniMode: 'mini', disableMiniMode: 'disableMini', toggleMiniMode: 'toggleMini'
    }
  },

  resize: {
    module: 'resize-handler',
    version: '5.0.0',
    category: CATEGORIES.UI,
    methods: {
      setWidth: { original: 'setWidth', args: ['container', 'width'], returns: 'void', requiresEl: true },
      resetWidth: { original: 'resetWidth', args: ['container?'], returns: 'void', requiresEl: true },
      getWidth: { original: 'getWidth', args: ['container?'], returns: 'number', requiresEl: true }
    },
    legacyMethods: { setWidth: 'setWidth', resetWidth: 'resetWidth', getWidth: 'getWidth' }
  },

  context: {
    module: 'context-menu',
    version: '5.0.0',
    category: CATEGORIES.UI,
    methods: {
      show: { original: 'showMenu', args: ['x', 'y', 'itemId', 'actions?'], returns: 'void' },
      hide: { original: 'hideMenu', args: [] as DynObj[], returns: 'void' }
    },
    legacyMethods: { showContextMenu: 'show', hideContextMenu: 'hide' }
  },

  submenu: {
    module: 'submenu-handler',
    version: '5.0.0',
    category: CATEGORIES.UI,
    methods: {
      toggle: { original: 'toggleSubmenu', args: ['element'], returns: 'void' },
      closeAll: { original: 'closeAllSubmenus', args: ['container?'], returns: 'void', requiresEl: true }
    },
    legacyMethods: { toggleSubmenu: 'toggle', closeAllSubmenus: 'closeAll' }
  }
};

export default UI_CONTRACTS;
