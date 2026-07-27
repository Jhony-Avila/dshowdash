// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Loading Progress - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, LOADING_STATES from ./constants.js
//   createLoadingProgress from ./manager.js
//   getLoadingProgress, resetLoadingProgress, startLoading, doneLoading, setLoadi...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LOADING_STATES — exported value
//   createLoadingProgress — exported value
//   getLoadingProgress — exported value
//   resetLoadingProgress — exported value
//   startLoading — exported value
//   doneLoading — exported value
//   setLoadingProgress — exported value
//   isLoading — exported value
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

export { VERSION, MODULE_ID, LOADING_STATES } from './constants.js';
export { createLoadingProgress } from './manager.js';
export {
  getLoadingProgress,
  resetLoadingProgress,
  startLoading,
  doneLoading,
  setLoadingProgress,
  isLoading,
  info,
  healthCheck
} from './api.js';

import { VERSION, MODULE_ID, LOADING_STATES } from './constants.js';
import { createLoadingProgress } from './manager.js';
import {
  getLoadingProgress,
  resetLoadingProgress,
  startLoading,
  doneLoading,
  setLoadingProgress,
  isLoading,
  info,
  healthCheck
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  LOADING_STATES,
  createLoadingProgress,
  getLoadingProgress,
  resetLoadingProgress,
  startLoading,
  doneLoading,
  setLoadingProgress,
  isLoading,
  info,
  healthCheck
};
