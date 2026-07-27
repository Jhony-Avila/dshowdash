// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-engine-redirect
// PURPOSE: MainEngine - Redirect to modular version
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   healthCheck() — exported function
//   createMainEngine — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
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

export * from './main-engine/index.js';
export { default } from './main-engine/index.js';
export { createMainEngine } from './main-engine/index.js';

const MODULE_ID = 'main-engine-redirect';
const VERSION = '8.0.0-UNIFIED';

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { redirectActive: true } };
}

export { MODULE_ID, VERSION };
