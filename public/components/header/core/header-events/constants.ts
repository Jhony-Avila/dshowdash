// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.0.0-P0-AUTH-OWNERSHIP)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/header-events/constants
// PURPOSE: Defines version, module ID and telemetry action constants
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   VERSION — module version constant
//   MODULE_ID — module identifier constant
//   TELEMETRY_ACTIONS — frozen object with telemetry event name constants
// ═══════════════════════════════════════════════════════════════

// Header Events - Constants
// @version 6.0.0-P0-AUTH-OWNERSHIP
'use strict';

export const VERSION = '6.0.0-P0-AUTH-OWNERSHIP';
export const MODULE_ID = 'header/core/header-events';

export const TELEMETRY_ACTIONS = Object.freeze({
  HEADER: {
    REFRESH_DONE: 'header:refresh:done',
    DEGRADED: 'header:degraded'
  }
});
