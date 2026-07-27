// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (11.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel-01 Table Component - Modular Entry Point
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TableComponent from ./table-component.js
//
// PROVIDES:
//   TableComponent — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   info — exported value
//   healthCheck — exported value
//   TABLE_EVENTS — exported value
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

// Re-export tudo do table-component
export { TableComponent, VERSION, MODULE_ID, info, healthCheck } from './table-component.js';
export { TABLE_EVENTS } from './events.js';

// Re-export default
import TableComponent from './table-component.js';
export default TableComponent;
