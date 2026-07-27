// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/url-state
// PURPOSE: Panel-01 URL State - Shim para RouteStateService
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RouteStateService from /core/navigation/route-state-service.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   setState() — exported function
//   clearState() — exported function
//   onPopState() — exported function
//   getShareableURL() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import RouteStateService from '/core/navigation/route-state-service.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/url-state';
const PANEL_ID = 'panel-01';
const ALLOWED_KEYS = ['situacao', 'centro', 'q', 'dataInicio', 'dataFim', 'page', 'sort', 'order'];

export function getState() {
  const result = RouteStateService.getState(PANEL_ID);
  if (result && result.ok && result.data) {
    const state: Record<string, unknown> = {};
    for (let i = 0; i < ALLOWED_KEYS.length; i++) {
      const k = ALLOWED_KEYS[i];
      if (result.data[k] !== undefined) state[k] = result.data[k];
    }
    if (state.page) state.page = parseInt(String(state.page)) || 1;
    if (state.sort) { state.sortField = state.sort; delete state.sort; }
    return Object.keys(state).length > 0 ? state : {};
  }
  return {};
}

export function setState(state: Record<string, unknown>, replace?: boolean) {
  if (replace === undefined) replace = true;
  const patch: Record<string, unknown> = {};
  if (state) {
    for (const k in state) {
      if (state.hasOwnProperty(k) && state[k] !== null && state[k] !== undefined && state[k] !== '') {
        patch[k] = state[k];
      }
    }
    if (state.sortField) { patch.sort = state.sortField; delete patch.sortField; }
  }
  RouteStateService.setState(PANEL_ID, patch, { replace });
}

export function clearState() {
  RouteStateService.clearState(PANEL_ID);
}

export function onPopState(callback: (...args: unknown[]) => unknown) {
  return RouteStateService.subscribe(PANEL_ID, callback);
}

export function getShareableURL(filters: Record<string, unknown>) {
  return RouteStateService.getShareableURL(PANEL_ID, filters, { allowedKeys: ALLOWED_KEYS });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export function getVersion() { return VERSION; }

export default { getState, setState, clearState, onPopState, getShareableURL, info, healthCheck, VERSION, MODULE_ID };
