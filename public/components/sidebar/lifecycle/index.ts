// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.4.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Sidebar Lifecycle Module - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createInitializer — exported value
//   createSetupCoordinator — exported value
//   createDestroyer — exported value
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

export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.lifecycle';

export { createInitializer } from './initializer.js';
export { createSetupCoordinator } from './setup-coordinator.js';
export { createDestroyer } from './destroyer.js';
