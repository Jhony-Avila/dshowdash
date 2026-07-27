// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-FACTORY-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-contracts
// PURPOSE: NavRail Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   LOCAL_EVENTS — exported value
//   NAVRAIL_EVENTS — exported value
//   ACTION_TYPES — exported value
//   DEFAULT_CONFIG — exported value
//   mergeConfig() — exported function
//   createEventPayload() — exported function
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

export const MODULE_ID = 'navrail-contracts';
export const VERSION = '5.0.0-FACTORY';

export const LOCAL_EVENTS = {
  READY: 'navrail:ready',
  DESTROYED: 'navrail:destroyed',
  ERROR: 'navrail:error',
  ITEM_CLICK: 'navrail:item:click',
  GROUP_RENDER: 'navrail:group:render',
  TOGGLE_SIDEBAR: 'navrail:toggle-sidebar',
  OPEN_PANEL: 'navrail:open-panel',
  MODE_DESKTOP: 'navrail:mode:desktop',
  MODE_MOBILE: 'navrail:mode:mobile'
};

export const NAVRAIL_EVENTS = LOCAL_EVENTS;

export const ACTION_TYPES = {
  OPEN_PANEL: 'openPanel',
  TOGGLE_SIDEBAR: 'toggleSidebar',
  NAVIGATE: 'navigate',
  EXTERNAL: 'external'
};

export const DEFAULT_CONFIG = {
  mobileBreakpoint: 500,
  tabletBreakpoint: 1024,
  railWidth: 72,
  itemSize: 48,
  bottomNavHeight: 64
};

export function mergeConfig(userConfig: Record<string, unknown> = {}) {
  return { ...DEFAULT_CONFIG, ...userConfig };
}

export function createEventPayload(type: string, data: Record<string, unknown> = {}) {
  return { type, timestamp: Date.now(), source: 'navrail', ...data };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, localEvents: Object.keys(LOCAL_EVENTS).length, actionTypes: Object.keys(ACTION_TYPES).length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { contractsReady: true } };
}

export default { MODULE_ID, VERSION, LOCAL_EVENTS, NAVRAIL_EVENTS, ACTION_TYPES, DEFAULT_CONFIG, mergeConfig, createEventPayload, info, healthCheck };
