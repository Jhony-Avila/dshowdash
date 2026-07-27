// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: toast-catalog
// PURPOSE: Toast Catalog - Local Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TOAST_EVENTS — exported value
//   TOAST_LISTENERS — exported value
//   TOAST_TYPES — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-P18EC';
export const MODULE_ID = 'toast-catalog';

// TOAST_EVENTS - Events emitted by toast component
export const TOAST_EVENTS = Object.freeze({
  SHOWN: 'toast:shown',
  DISMISSED: 'toast:dismissed',
  DISMISSED_ALL: 'toast:dismissed:all',
  READY: 'toast:ready',
  QUEUE_UPDATED: 'toast:queue:updated',
  ERROR: 'toast:error',
  CLOSE_CLICKED: 'toast:close:clicked',
  ACTION_CLICKED: 'toast:action:clicked'
});

// TOAST_LISTENERS - Events the toast listens to
export const TOAST_LISTENERS = Object.freeze({
  SHOW: 'toast:show',
  DISMISS: 'toast:dismiss',
  DISMISS_ALL: 'toast:dismiss:all',
  APP_ERROR: 'app:error',
  API_ERROR: 'api:error',
  AUTH_ERROR: 'auth:error',
  VALIDATION_ERROR: 'validation:error'
});

// TOAST_TYPES - Toast notification types
export const TOAST_TYPES = Object.freeze({
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
});

export default { TOAST_EVENTS, TOAST_LISTENERS, TOAST_TYPES, VERSION, MODULE_ID };
