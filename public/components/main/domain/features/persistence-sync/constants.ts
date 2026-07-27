// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main.feature.persistence-sync
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   STATE_VERSION — exported value
//   STORAGE_KEYS — exported value
//   SYNC_DEBOUNCE_MS — exported value
//   MAX_HISTORY_SIZE — exported value
//   SCHEMAS — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Persistence Sync - Constants
 * @module persistence-sync/constants
 */
'use strict';

export const MODULE_ID = 'main.feature.persistence-sync.constants';
export const VERSION = '1.2.0-ENTERPRISE';
export const STATE_VERSION = 2;

export const STORAGE_KEYS = Object.freeze({
  NAVIGATION_STATE: 'dsd:main:navigation',
  CONTAINER_STATE: 'dsd:main:containers',
  USER_PREFERENCES: 'dsd:main:preferences',
  STATE_META: 'dsd:main:meta'
});

export const SYNC_DEBOUNCE_MS = 500;
export const MAX_HISTORY_SIZE = 20;

export const SCHEMAS = {
  navigation: {
    required: ['current', 'history'],
    types: {
      current: ['string', 'null'],
      history: 'array'
    }
  },
  containers: {
    required: [] as string[],
    types: {
      layout: 'string',
      panels: 'array'
    }
  },
  preferences: {
    required: [] as string[],
    types: {
      theme: 'string',
      language: 'string'
    }
  }
};
