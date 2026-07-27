// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-03/core/states
// PURPOSE: Panel-03 - State Machine States
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STATES — exported value
//   getVersion() — exported function
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
export const MODULE_ID = 'panel-03/core/states';

export const STATES = Object.freeze({ IDLE: 'IDLE', MOUNTING: 'MOUNTING', MOUNTED: 'MOUNTED', LOADING: 'LOADING', READY: 'READY', ERROR: 'ERROR', DEGRADED: 'DEGRADED', UNMOUNTING: 'UNMOUNTING', DESTROYED: 'DESTROYED' });

export function getVersion() { return VERSION; }
export default STATES;
