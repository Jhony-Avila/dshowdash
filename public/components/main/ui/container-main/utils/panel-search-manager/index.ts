// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel Search Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, SEARCH_MODES, MATCH_TYPES from ./constants.js
//   createPanelSearchManager, getPanelSearchManager, init, destroy, open, close, ...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SEARCH_MODES — exported value
//   MATCH_TYPES — exported value
//   createPanelSearchManager — exported value
//   getPanelSearchManager — exported value
//   init — exported value
//   destroy — exported value
//   open — exported value
//   close — exported value
//   toggle — exported value
//   search — exported value
//   nextMatch — exported value
//   previousMatch — exported value
//   goToMatch — exported value
//   clearSearch — exported value
//   setMode — exported value
//   subscribe — exported value
//   healthCheck — exported value
//   info — exported value
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

export { VERSION, MODULE_ID, SEARCH_MODES, MATCH_TYPES } from './constants.js';

export {
  createPanelSearchManager,
  getPanelSearchManager,
  init,
  destroy,
  open,
  close,
  toggle,
  search,
  nextMatch,
  previousMatch,
  goToMatch,
  clearSearch,
  setMode,
  subscribe,
  healthCheck,
  info
} from './api.js';

import { VERSION, MODULE_ID, SEARCH_MODES, MATCH_TYPES } from './constants.js';
import {
  createPanelSearchManager,
  getPanelSearchManager,
  init,
  destroy,
  open,
  close,
  toggle,
  search,
  nextMatch,
  previousMatch,
  goToMatch,
  clearSearch,
  setMode,
  subscribe,
  healthCheck,
  info
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  SEARCH_MODES,
  MATCH_TYPES,
  createPanelSearchManager,
  getPanelSearchManager,
  init,
  destroy,
  open,
  close,
  toggle,
  search,
  nextMatch,
  previousMatch,
  goToMatch,
  clearSearch,
  setMode,
  subscribe,
  healthCheck,
  info
};
