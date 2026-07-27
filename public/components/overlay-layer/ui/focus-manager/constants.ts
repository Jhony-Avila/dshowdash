// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-focus-manager
// PURPOSE: Focus Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FOCUSABLE_SELECTORS — exported value
//   DEFAULT_CONFIG — exported value
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

export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer-focus-manager';

export const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'audio[controls]',
  'video[controls]',
  'details > summary'
].join(', ');

export const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  autoFocusFirst: true,
  trapFocus: true,
  restoreFocus: true,
  focusDelay: 50,
  scrollIntoView: true,
  historyLimit: 10
});

export default {
  VERSION,
  MODULE_ID,
  FOCUSABLE_SELECTORS,
  DEFAULT_CONFIG
};
