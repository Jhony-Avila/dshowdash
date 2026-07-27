// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:update-notifier
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NOTIFIER_STATES — exported value
//   UPDATE_TYPES — exported value
//   DEFAULT_CONFIG — exported value
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
 * Update Notifier - Constants
 * @module update-notifier/constants
 */
'use strict';

export const VERSION = '1.0.0';
export const MODULE_ID = 'container-main:update-notifier';

export const NOTIFIER_STATES = Object.freeze({
  IDLE: 'idle',
  CHECKING: 'checking',
  UPDATE_AVAILABLE: 'update_available',
  UP_TO_DATE: 'up_to_date',
  ERROR: 'error'
});

export const UPDATE_TYPES = Object.freeze({
  MAJOR: 'major',
  MINOR: 'minor',
  PATCH: 'patch',
  HOTFIX: 'hotfix'
});

export const DEFAULT_CONFIG = Object.freeze({
  checkInterval: 5 * 60 * 1000,
  versionEndpoint: '/api/version.json',
  autoCheck: true,
  showNotification: true,
  position: 'bottom-right',
  dismissable: true,
  autoReload: false,
  debug: false
});
