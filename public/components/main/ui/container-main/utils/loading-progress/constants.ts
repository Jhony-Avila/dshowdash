// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:loading-progress
// PURPOSE: Loading Progress - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LOADING_STATES — exported value
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
'use strict';

export const VERSION = '1.0.0';
export const MODULE_ID = 'container-main:loading-progress';

export const LOADING_STATES = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  COMPLETING: 'completing',
  COMPLETE: 'complete',
  ERROR: 'error'
});

export const DEFAULT_CONFIG = Object.freeze({
  minDuration: 200,
  trickleSpeed: 200,
  trickleAmount: 2,
  autoComplete: true,
  autoCompleteDelay: 500,
  showSpinner: true,
  parent: null,
  position: 'top',
  color: 'var(--cm-color-primary, #8b5cf6)',
  height: 3,
  zIndex: 10000
});
