// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-contracts-performance
// PURPOSE: Sidebar Feature Contracts - Performance Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CATEGORIES from ../categories.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   PERFORMANCE_CONTRACTS — exported value
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


export const MODULE_ID = 'sidebar-contracts-performance';
export const VERSION = '1.2.0-ES6';

export const PERFORMANCE_CONTRACTS = {
  virtual: {
    module: 'virtual-list',
    version: '5.0.0',
    category: CATEGORIES.PERFORMANCE,
    methods: {
      enable: { original: 'enable', args: ['items'], returns: 'void' },
      disable: { original: 'disable', args: [] as DynObj[], returns: 'void' },
      isEnabled: { original: 'isEnabled', args: [] as DynObj[], returns: 'boolean' },
      state: { original: 'getState', args: [] as DynObj[], returns: 'object' },
      scrollTo: { original: 'scrollToItem', args: ['itemId'], returns: 'void' }
    },
    legacyMethods: {
      enableVirtualList: 'enable', disableVirtualList: 'disable',
      isVirtualListEnabled: 'isEnabled', getVirtualListState: 'state', scrollToVirtualItem: 'scrollTo'
    }
  }
};

export default PERFORMANCE_CONTRACTS;
