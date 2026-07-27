// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Split View Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, SPLIT_ORIENTATIONS, SPLIT_POSITIONS from ./constants.js
//   createSplitViewManager, getSplitViewManager, activate, deactivate, toggle, se...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SPLIT_ORIENTATIONS — exported value
//   SPLIT_POSITIONS — exported value
//   createSplitViewManager — exported value
//   getSplitViewManager — exported value
//   activate — exported value
//   deactivate — exported value
//   toggle — exported value
//   setOrientation — exported value
//   setRatio — exported value
//   collapse — exported value
//   expand — exported value
//   toggleCollapse — exported value
//   isCollapsed — exported value
//   setContent — exported value
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

export { VERSION, MODULE_ID, SPLIT_ORIENTATIONS, SPLIT_POSITIONS } from './constants.js';

export {
  createSplitViewManager,
  getSplitViewManager,
  activate,
  deactivate,
  toggle,
  setOrientation,
  setRatio,
  collapse,
  expand,
  toggleCollapse,
  isCollapsed,
  setContent,
  subscribe,
  healthCheck,
  info
} from './api.js';

import { VERSION, MODULE_ID, SPLIT_ORIENTATIONS, SPLIT_POSITIONS } from './constants.js';
import {
  createSplitViewManager,
  getSplitViewManager,
  activate,
  deactivate,
  toggle,
  setOrientation,
  setRatio,
  collapse,
  expand,
  toggleCollapse,
  isCollapsed,
  setContent,
  subscribe,
  healthCheck,
  info
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  SPLIT_ORIENTATIONS,
  SPLIT_POSITIONS,
  createSplitViewManager,
  getSplitViewManager,
  activate,
  deactivate,
  toggle,
  setOrientation,
  setRatio,
  collapse,
  expand,
  toggleCollapse,
  isCollapsed,
  setContent,
  subscribe,
  healthCheck,
  info
};
