// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-engine-constants
// PURPOSE: MainEngine Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_PANEL — exported value
//   MAX_CONTAINERS — exported value
//   CRITICAL_PANELS — exported value
//   ENGINE_STATES — exported value
//   ENGINE_EVENTS — exported value
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

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'main-engine-constants';

export const DEFAULT_PANEL = 'panel-home';
export const MAX_CONTAINERS = 3;
export const CRITICAL_PANELS = Object.freeze(['panel-01', 'panel-cards', 'panel-10']);

export const ENGINE_STATES = Object.freeze({
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  READY: 'ready',
  NAVIGATING: 'navigating',
  LOADING_PANEL: 'loading-panel',
  MOUNTING: 'mounting',
  UNMOUNTING: 'unmounting',
  ERROR: 'error',
  RECOVERING: 'recovering',
  DESTROYED: 'destroyed'
});

export const ENGINE_EVENTS = Object.freeze({
  READY: 'main:ready',
  DESTROYED: 'main:destroyed',
  ERROR: 'main:error',
  AUTH_REQUIRED: 'main:auth-required',
  NAV_START: 'main:navigation:start',
  NAV_END: 'main:navigation:end',
  PANEL_LOADED: 'main:panel:loaded',
  PANEL_UNMOUNTED: 'main:panel:unmounted',
  SECONDARY_OPENING: 'main:secondary:opening',
  SECONDARY_OPENED: 'main:secondary:opened',
  SECONDARY_CLOSED: 'main:secondary:closed',
  LAYOUT_CHANGED: 'main:layout:changed'
});

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, statesCount: Object.keys(ENGINE_STATES).length, eventsCount: Object.keys(ENGINE_EVENTS).length };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { constantsLoaded: true } };
}

export default { VERSION, MODULE_ID, DEFAULT_PANEL, MAX_CONTAINERS, CRITICAL_PANELS, ENGINE_STATES, ENGINE_EVENTS, info, healthCheck };
