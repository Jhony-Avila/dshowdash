// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:keyboard-navigation
// PURPOSE: Keyboard Navigation Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   KEY_CODES — exported value
//   NAVIGATION_MODES — exported value
//   FOCUS_WRAP — exported value
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
export const MODULE_ID = 'container-main:keyboard-navigation';

export const KEY_CODES = Object.freeze({
  TAB: 'Tab',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
});

export const NAVIGATION_MODES = Object.freeze({
  LINEAR: 'linear',
  ROVING: 'roving',
  GRID: 'grid',
  MENU: 'menu'
});

export const FOCUS_WRAP = Object.freeze({
  NONE: 'none',
  WRAP: 'wrap',
  STOP: 'stop'
});

export const DEFAULT_CONFIG = Object.freeze({
  mode: NAVIGATION_MODES.LINEAR,
  wrapBehavior: FOCUS_WRAP.WRAP,
  enableArrowNavigation: true,
  enableHomeEnd: true,
  enableTypeahead: true,
  typeaheadTimeout: 500,
  orientation: 'horizontal',
  announceNavigation: true,
  persistFocusPosition: true
});

export const STORAGE_KEY = 'dsd:container-main:keyboard-nav';
