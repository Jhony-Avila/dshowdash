// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-core-filters
// PURPOSE: Panel Session Admin - Filters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   localState from ./state.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   setFilter() — exported function
//   clearFilters() — exported function
//   toggleInlineFilters() — exported function
//   setInlineFilter() — exported function
//   getFilteredWithInline() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import * as Store from '../state/store.js';
import tracker from '../telemetry/tracker.js';
import { localState } from './state.js';

export function setFilter(key: string, value: string) {
  Store.dispatch({ type: 'SET_FILTER', payload: { [key]: value } });
  tracker.filterChanged({ [key]: value });
}

export function clearFilters() {
  Store.dispatch({ type: 'CLEAR_FILTERS' });
  localState.inlineFilters = {};
  tracker.filterCleared();
}

export function toggleInlineFilters(onStateChange?: (state: unknown) => void) {
  localState.showInlineFilters = !localState.showInlineFilters;
  if (!localState.showInlineFilters) localState.inlineFilters = {};
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: 'inline-filters:toggle', visible: localState.showInlineFilters });
}

export function setInlineFilter(key: string, value: string, onStateChange?: (state: unknown) => void) {
  if (value) {
    (localState.inlineFilters as Record<string, string>)[key] = value;
  } else {
    delete (localState.inlineFilters as Record<string, string>)[key];
  }
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: 'inline-filter:set', key, value });
}

export function getFilteredWithInline() {
  let sessions = Store.getFilteredSessions();
  
  if (Object.keys(localState.inlineFilters).length > 0) {
    sessions = sessions.filter(s => {
      for (const [key, value] of Object.entries(localState.inlineFilters)) {
        if (!value) continue;
        const v = value.toLowerCase();
        if (key === 'user' && !(String(s.username || '')).toLowerCase().includes(v)) return false;
        if (key === 'device' && String(s.device_type || '').toLowerCase() !== v) return false;
        if (key === 'browser' && !(String(s.browser || '')).toLowerCase().includes(v)) return false;
        if (key === 'os' && !(String(s.os || '')).toLowerCase().includes(v)) return false;
        if (key === 'ip' && !(String(s.origin_ip || s.last_ip || '')).includes(v)) return false;
        if (key === 'status') {
          if (v === 'active' && !s.is_active) return false;
          if (v === 'inactive' && s.is_active) return false;
        }
      }
      return true;
    });
  }
  
  return sessions;
}

export default { setFilter, clearFilters, toggleInlineFilters, setInlineFilter, getFilteredWithInline };

export const MODULE_ID = 'panels-panel-session-admin-core-filters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } }; }
