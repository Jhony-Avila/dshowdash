// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main/ui
// PURPOSE: Main UI - Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   healthCheck() — exported function
//   info() — exported function
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
export * from './renderer.js';
export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'main/ui';
export function healthCheck() { return { status: 'HEALTHY', module: MODULE_ID, version: VERSION, timestamp: new Date().toISOString() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, exports: ['renderer'], healthCheck: healthCheck(), timestamp: Date.now() }; }
