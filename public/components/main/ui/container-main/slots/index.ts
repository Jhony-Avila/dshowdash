// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-PHASE4-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:slots
// PURPOSE: container-main/slots/index.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SLOT_MODULES — exported value
//   info() — exported function
//   healthCheck() — exported function
//   SlotManager — exported value
//   SlotPresets — exported value
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

export const VERSION = '2.0.0-PHASE4';
export const MODULE_ID = 'container-main:slots';

// Slot Manager
export * from './slot-manager.js';
export { default as SlotManager } from './slot-manager.js';

// FASE 4 - Slot Presets
export * from './slot-presets.js';
export { default as SlotPresets } from './slot-presets.js';

// Lista de módulos
export const SLOT_MODULES = Object.freeze(['slot-manager', 'slot-presets']);

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, modules: SLOT_MODULES };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID };
}

export default { VERSION, MODULE_ID, SLOT_MODULES, info, healthCheck };
