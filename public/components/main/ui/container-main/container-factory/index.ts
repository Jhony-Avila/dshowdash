// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Container Factory - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_OPTIONS — exported value
//   ICONS — exported value
//   createContainerDOM — exported value
//   initializeComponents — exported value
//   destroyComponents — exported value
//   LIFECYCLE_HOOKS — exported value
//   createLifecycleAPI — exported value
//   createStateAPI — exported value
//   createActionsAPI — exported value
//   createContentAPI — exported value
//   createLoadingAPI — exported value
//   createToastAPI — exported value
//   createUIAPI — exported value
//   createAccessibilityAPI — exported value
//   createEventsAPI — exported value
//   createDebugAPI — exported value
//   createGettersAPI — exported value
//   info — exported value
//   ... and 1 more exports
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

export { VERSION, MODULE_ID } from './constants.js';
export { DEFAULT_OPTIONS } from './default-options.js';
export { ICONS } from './icons.js';
export { createContainerDOM } from './dom/index.js';
export { initializeComponents, destroyComponents, LIFECYCLE_HOOKS } from './components/index.js';
export {
  createLifecycleAPI, createStateAPI, createActionsAPI, createContentAPI,
  createLoadingAPI, createToastAPI, createUIAPI, createAccessibilityAPI,
  createEventsAPI, createDebugAPI, createGettersAPI
} from './api/index.js';
export { info, healthCheck } from './diagnostics/index.js';
