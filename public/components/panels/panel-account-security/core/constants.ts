// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18G2-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-account-security
// PURPOSE: Panel Account Security - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   EVENTS — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   UI_ACTIONS — exported value
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

export const MODULE_ID = 'panel-account-security';
export const VERSION = '9.3.0-P2-ENTERPRISE';

// P18G2: EVENTS removed - use import { PANEL_EVENTS } from '/core/runtime/events/index.js'
// Local UI actions (not EventBus events) - renamed to avoid confusion
export const UI_ACTIONS = Object.freeze({
  PASSWORD_CHANGED: 'password:changed'
});

export const API_ENDPOINTS = {
  GET_SECURITY_INFO: '/api/users/security.php',
  CHANGE_PASSWORD: '/api/users/change-password.php'
};

export default { MODULE_ID, VERSION, UI_ACTIONS, API_ENDPOINTS };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } }; }
