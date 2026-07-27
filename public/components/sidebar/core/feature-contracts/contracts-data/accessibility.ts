// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-contracts-accessibility
// PURPOSE: Sidebar Feature Contracts - Accessibility Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CATEGORIES from ../categories.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   ACCESSIBILITY_CONTRACTS — exported value
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


export const MODULE_ID = 'sidebar-contracts-accessibility';
export const VERSION = '1.2.0-ES6';

export const ACCESSIBILITY_CONTRACTS = {
  a11y: {
    module: 'screen-reader',
    version: '5.0.0',
    category: CATEGORIES.ACCESSIBILITY,
    methods: {
      announce: { original: 'announce', args: ['message', 'priority?'], returns: 'void' },
      enhance: { original: 'enhance', args: ['container?'], returns: 'void', requiresEl: true },
      highContrast: { original: 'enableHighContrast', args: ['container?'], returns: 'void', requiresEl: true },
      disableHighContrast: { original: 'disableHighContrast', args: ['container?'], returns: 'void', requiresEl: true },
      largeText: { original: 'enableLargeText', args: ['container?'], returns: 'void', requiresEl: true },
      disableLargeText: { original: 'disableLargeText', args: ['container?'], returns: 'void', requiresEl: true }
    },
    legacyMethods: {
      announce: 'announce', enhanceAccessibility: 'enhance',
      enableHighContrast: 'highContrast', disableHighContrast: 'disableHighContrast',
      enableLargeText: 'largeText', disableLargeText: 'disableLargeText'
    }
  },

  landmarks: {
    module: 'accessibility-landmarks',
    version: '5.0.0',
    category: CATEGORIES.ACCESSIBILITY,
    methods: {
      apply: { original: 'applyLandmarks', args: ['container?'], returns: 'void', requiresEl: true },
      updateActive: { original: 'updateActiveItem', args: ['itemId'], returns: 'void' },
      setLoading: { original: 'setLoadingState', args: ['isLoading', 'message?'], returns: 'void' }
    },
    legacyMethods: {
      applyLandmarks: 'apply', updateActiveItemAria: 'updateActive', setLoadingAria: 'setLoading'
    }
  },

  shortcuts: {
    module: 'keyboard-shortcuts-extended',
    version: '5.0.0',
    category: CATEGORIES.ACCESSIBILITY,
    methods: {
      register: { original: 'register', args: ['id', 'shortcut'], returns: 'void' },
      unregister: { original: 'unregister', args: ['id'], returns: 'void' },
      enable: { original: 'enable', args: [] as DynObj[], returns: 'void' },
      disable: { original: 'disable', args: [] as DynObj[], returns: 'void' },
      list: { original: 'getAll', args: [] as DynObj[], returns: 'object' },
      showHelp: { original: 'showHelp', args: [] as DynObj[], returns: 'void' }
    },
    legacyMethods: {
      registerShortcut: 'register', unregisterShortcut: 'unregister',
      enableShortcuts: 'enable', disableShortcuts: 'disable',
      getAllShortcuts: 'list', showShortcutsHelp: 'showHelp'
    }
  }
};

export default ACCESSIBILITY_CONTRACTS;
