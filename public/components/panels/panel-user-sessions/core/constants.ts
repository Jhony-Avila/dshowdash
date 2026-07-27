// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-sessions
// PURPOSE: Panel User Sessions - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   EVENTS — exported value
//   API_ENDPOINTS — exported value
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

export const MODULE_ID = 'panel-user-sessions';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export const EVENTS = {
  MOUNTED: 'panel:user-sessions:mounted',
  UNMOUNTED: 'panel:user-sessions:unmounted',
  READY: 'panel:user-sessions:ready',
  ERROR: 'panel:user-sessions:error',
  SESSION_TERMINATED: 'panel:user-sessions:session:terminated'
};

export const API_ENDPOINTS = {
  LIST_SESSIONS: '/api/users/sessions.php',
  TERMINATE_SESSION: '/api/users/sessions.php',
  TERMINATE_ALL: '/api/users/sessions.php'
};

export default { MODULE_ID, VERSION, EVENTS, API_ENDPOINTS };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } });
