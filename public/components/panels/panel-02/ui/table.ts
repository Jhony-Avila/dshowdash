// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: table
// PURPOSE: Panel-02 Table - Re-export from modular structure
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   TableComponent — exported value
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

export { VERSION, MODULE_ID, TableComponent, TableComponent as default } from './table/index.js';

export function info() { return { moduleId: 'panel-02/ui/table', version: '8.1.0-ENTERPRISE' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panel-02/ui/table', version: '8.1.0-ENTERPRISE', checks: { tableReady: true } }; }
