// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Kernel Facades - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createSlotFacade — exported value
//   createCapabilityFacade — exported value
//   createLayoutFacade — exported value
//   createListenerFacade — exported value
//   createMetricsFacade — exported value
//   createImageFacade — exported value
//   createResourceFacade — exported value
//   createDeprecationFacade — exported value
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
export const MODULE_ID = 'main.ui.container-main.kernel.facades';

export { createSlotFacade } from './slot-facade.js';
export { createCapabilityFacade } from './capability-facade.js';
export { createLayoutFacade } from './layout-facade.js';
export { createListenerFacade } from './listener-facade.js';
export { createMetricsFacade } from './metrics-facade.js';
export { createImageFacade } from './image-facade.js';
export { createResourceFacade } from './resource-facade.js';
export { createDeprecationFacade } from './deprecation-facade.js';
