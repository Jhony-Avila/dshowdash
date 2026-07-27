// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: API - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.container-factory.api';

export { createLifecycleAPI } from './lifecycle-api.js';
export { createStateAPI } from './state-api.js';
export { createActionsAPI } from './actions-api.js';
export { createContentAPI } from './content-api.js';
export { createLoadingAPI } from './loading-api.js';
export { createToastAPI } from './toast-api.js';
export { createUIAPI } from './ui-api.js';
export { createAccessibilityAPI } from './accessibility-api.js';
export { createEventsAPI } from './events-api.js';
export { createDebugAPI } from './debug-api.js';
export { createGettersAPI } from './getters-api.js';
