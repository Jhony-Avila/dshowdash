// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Keyboard Navigation Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, KEY_CODES, NAVIGATION_MODES, FOCUS_WRAP from ./constants.js
//   createKeyboardNavigationManager, getKeyboardNavigationManager, init, destroy,...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   KEY_CODES — exported value
//   NAVIGATION_MODES — exported value
//   FOCUS_WRAP — exported value
//   createKeyboardNavigationManager — exported value
//   getKeyboardNavigationManager — exported value
//   init — exported value
//   destroy — exported value
//   registerGroup — exported value
//   unregisterGroup — exported value
//   setActiveGroup — exported value
//   focusFirst — exported value
//   focusLast — exported value
//   focusNext — exported value
//   focusPrevious — exported value
//   focusByIndex — exported value
//   registerShortcut — exported value
//   unregisterShortcut — exported value
//   getShortcuts — exported value
//   ... and 5 more exports
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

export { VERSION, MODULE_ID, KEY_CODES, NAVIGATION_MODES, FOCUS_WRAP } from './constants.js';

export {
  createKeyboardNavigationManager,
  getKeyboardNavigationManager,
  init,
  destroy,
  registerGroup,
  unregisterGroup,
  setActiveGroup,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious,
  focusByIndex,
  registerShortcut,
  unregisterShortcut,
  getShortcuts,
  enableShortcut,
  disableShortcut,
  subscribe,
  healthCheck,
  info
} from './api.js';

import { VERSION, MODULE_ID, KEY_CODES, NAVIGATION_MODES, FOCUS_WRAP } from './constants.js';
import {
  createKeyboardNavigationManager,
  getKeyboardNavigationManager,
  init,
  destroy,
  registerGroup,
  unregisterGroup,
  setActiveGroup,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious,
  focusByIndex,
  registerShortcut,
  unregisterShortcut,
  getShortcuts,
  enableShortcut,
  disableShortcut,
  subscribe,
  healthCheck,
  info
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  KEY_CODES,
  NAVIGATION_MODES,
  FOCUS_WRAP,
  createKeyboardNavigationManager,
  getKeyboardNavigationManager,
  init,
  destroy,
  registerGroup,
  unregisterGroup,
  setActiveGroup,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious,
  focusByIndex,
  registerShortcut,
  unregisterShortcut,
  getShortcuts,
  enableShortcut,
  disableShortcut,
  subscribe,
  healthCheck,
  info
};
