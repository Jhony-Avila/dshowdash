// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Layout Manager Module - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LAYOUT_STATES — exported value
//   DOCK_ZONES — exported value
//   SPLIT_MODES — exported value
//   VALID_TRANSITIONS — exported value
//   DEFAULT_CONSTRAINTS — exported value
//   createConstraintsManager — exported value
//   createPositionCalculator — exported value
//   createStyleApplicator — exported value
//   createPanelRegistry — exported value
//   createStateManager — exported value
//   createDockController — exported value
//   createFullscreenController — exported value
//   createSplitController — exported value
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

export { 
  VERSION, MODULE_ID,
  LAYOUT_STATES, DOCK_ZONES, SPLIT_MODES,
  VALID_TRANSITIONS, DEFAULT_CONSTRAINTS 
} from './constants.js';

export { createConstraintsManager } from './constraints.js';
export { createPositionCalculator } from './position-calculator.js';
export { createStyleApplicator } from './style-applicator.js';
export { createPanelRegistry } from './panel-registry.js';
export { createStateManager } from './state-manager.js';
export { createDockController } from './dock-controller.js';
export { createFullscreenController } from './fullscreen-controller.js';
export { createSplitController } from './split-controller.js';
