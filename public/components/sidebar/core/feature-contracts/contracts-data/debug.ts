// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-contracts-debug
// PURPOSE: Sidebar Feature Contracts - Debug Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CATEGORIES from ../categories.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   DEBUG_CONTRACTS — exported value
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


export const MODULE_ID = 'sidebar-contracts-debug';
export const VERSION = '1.2.0-ES6';

export const DEBUG_CONTRACTS = {
  debug: {
    module: 'debug-panel',
    version: '5.0.0',
    category: CATEGORIES.DEBUG,
    methods: {
      open: { original: 'open', args: [] as DynObj[], returns: 'void' },
      close: { original: 'close', args: [] as DynObj[], returns: 'void' },
      toggle: { original: 'toggle', args: [] as DynObj[], returns: 'void' }
    },
    legacyMethods: { openDebugPanel: 'open', closeDebugPanel: 'close', toggleDebugPanel: 'toggle' }
  }
};

export default DEBUG_CONTRACTS;
