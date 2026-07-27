// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: context-provider
// PURPOSE: Context Provider - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RETRY_MAX — exported value
//   RETRY_DELAY — exported value
//   MAX_GLOBALSTATE_SIZE — exported value
//   getVersion() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '5.0.0-ENTERPRISE';
export const MODULE_ID = 'context-provider';

export const RETRY_MAX = 5;
export const RETRY_DELAY = 300;
export const MAX_GLOBALSTATE_SIZE = 50000;

export function getVersion() {
  return VERSION;
}

export default { VERSION, MODULE_ID, RETRY_MAX, RETRY_DELAY, MAX_GLOBALSTATE_SIZE, getVersion };
