// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Navigation History - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, NAVIGATION_TYPES from ./constants.js
//   createNavigationHistory from ./manager.js
//   getNavigationHistory, resetNavigationHistory, pushNavigation, goBack, goForwa...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NAVIGATION_TYPES — exported value
//   createNavigationHistory — exported value
//   getNavigationHistory — exported value
//   resetNavigationHistory — exported value
//   pushNavigation — exported value
//   goBack — exported value
//   goForward — exported value
//   canGoBack — exported value
//   canGoForward — exported value
//   info — exported value
//   healthCheck — exported value
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

export { VERSION, MODULE_ID, NAVIGATION_TYPES } from './constants.js';
export { createNavigationHistory } from './manager.js';
export {
  getNavigationHistory,
  resetNavigationHistory,
  pushNavigation,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  info,
  healthCheck
} from './api.js';

import { VERSION, MODULE_ID, NAVIGATION_TYPES } from './constants.js';
import { createNavigationHistory } from './manager.js';
import {
  getNavigationHistory,
  resetNavigationHistory,
  pushNavigation,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  info,
  healthCheck
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  NAVIGATION_TYPES,
  createNavigationHistory,
  getNavigationHistory,
  resetNavigationHistory,
  pushNavigation,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  info,
  healthCheck
};
