// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:dashboard-utils
// PURPOSE: Panel-05 Dashboard Utils - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:dashboard-utils';

export default { VERSION, MODULE_ID };

export function info() { return { moduleId: 'panels-panel-05-utils-constants', version: VERSION || '1.0.0' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-05-utils-constants', version: VERSION || '1.0.0', checks: { constantsLoaded: true } }; }
