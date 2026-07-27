// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:accessibility-manager
// PURPOSE: Accessibility Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   A11Y_FEATURES — exported value
//   ARIA_LIVE_REGIONS — exported value
//   CONTRAST_MODES — exported value
//   DEFAULT_CONFIG — exported value
//   STORAGE_KEY — exported value
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
export const MODULE_ID = 'container-main:accessibility-manager';

export const A11Y_FEATURES = Object.freeze({
  SCREEN_READER: 'screen-reader',
  HIGH_CONTRAST: 'high-contrast',
  REDUCED_MOTION: 'reduced-motion',
  LARGE_TEXT: 'large-text',
  FOCUS_INDICATORS: 'focus-indicators',
  KEYBOARD_ONLY: 'keyboard-only'
});

export const ARIA_LIVE_REGIONS = Object.freeze({
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off'
});

export const CONTRAST_MODES = Object.freeze({
  NORMAL: 'normal',
  HIGH: 'high',
  HIGHEST: 'highest'
});

export const DEFAULT_CONFIG = Object.freeze({
  enableAriaLive: true,
  enableFocusManagement: true,
  enableSkipLinks: true,
  enableLandmarks: true,
  announcePageChanges: true,
  focusIndicatorStyle: 'outline',
  contrastMode: CONTRAST_MODES.NORMAL,
  textScale: 1.0,
  persistPreferences: true
});

export const STORAGE_KEY = 'dsd:container-main:a11y-prefs';
