// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-contracts-data
// PURPOSE: Sidebar Feature Contracts - Data Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CATEGORIES from ../categories.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   DATA_CONTRACTS — exported value
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


export const MODULE_ID = 'sidebar-contracts-data';
export const VERSION = '1.3.0-ES6';

export const DATA_CONTRACTS = {
  badges: {
    module: 'dynamic-badges',
    version: '5.0.0',
    category: CATEGORIES.DATA,
    methods: {
      set: { original: 'setBadge', args: ['itemId', 'options'], returns: 'void' },
      get: { original: 'getBadge', args: ['itemId'], returns: 'object' },
      remove: { original: 'removeBadge', args: ['itemId'], returns: 'void' },
      increment: { original: 'incrementBadge', args: ['itemId', 'amount?'], returns: 'void' },
      decrement: { original: 'decrementBadge', args: ['itemId', 'amount?'], returns: 'void' },
      live: { original: 'setLiveBadge', args: ['itemId', 'fetchFn', 'interval?'], returns: 'void' },
      countdown: { original: 'setCountdownBadge', args: ['itemId', 'seconds', 'onComplete?'], returns: 'void' },
      listAll: { original: 'getAllBadges', args: [] as DynObj[], returns: 'object' },
      clearAll: { original: 'clearAllBadges', args: [] as DynObj[], returns: 'void' }
    },
    legacyMethods: {
      setDynamicBadge: 'set', getDynamicBadge: 'get', removeDynamicBadge: 'remove',
      incrementBadge: 'increment', decrementBadge: 'decrement', setLiveBadge: 'live',
      setCountdownBadge: 'countdown', getAllBadges: 'listAll', clearAllBadges: 'clearAll'
    }
  },

  notifications: {
    module: 'notification-dots',
    version: '5.0.0',
    category: CATEGORIES.DATA,
    methods: {
      show: { original: 'showDot', args: ['itemId', 'variant?', 'count?'], returns: 'void' },
      hide: { original: 'hideDot', args: ['itemId'], returns: 'void' },
      update: { original: 'updateCount', args: ['itemId', 'count'], returns: 'void' },
      increment: { original: 'incrementCount', args: ['itemId'], returns: 'void' },
      clearAll: { original: 'clearAll', args: [] as DynObj[], returns: 'void' }
    },
    legacyMethods: {
      showNotificationDot: 'show', hideNotificationDot: 'hide',
      updateNotificationCount: 'update', incrementNotification: 'increment', clearAllNotifications: 'clearAll'
    }
  }
};

export default DATA_CONTRACTS;
