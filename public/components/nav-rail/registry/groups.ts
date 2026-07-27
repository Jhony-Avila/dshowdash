// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-FACTORY-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-registry-groups
// PURPOSE: NavRail Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   GROUPS — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'navrail-registry-groups';
export const VERSION = '5.0.0-FACTORY';

export const GROUPS = [
  { id: 'operations', label: 'Operações', order: 1 },
  { id: 'analytics', label: 'Analytics', order: 2 },
  { id: 'data', label: 'Dados', order: 3 },
  { id: 'integrations', label: 'Integrações', order: 4 },
  { id: 'admin', label: 'Admin', order: 5 },
  { id: 'system', label: 'Sistema', order: 99 }
];

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, groupCount: GROUPS.length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { groupsLoaded: GROUPS.length > 0 } };
}

export default { GROUPS, MODULE_ID, VERSION, info, healthCheck };
