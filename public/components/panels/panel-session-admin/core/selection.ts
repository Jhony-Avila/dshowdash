// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-core-selection
// PURPOSE: Panel Session Admin - Selection & Expansion
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   localState from ./state.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   selectRow() — exported function
//   deselectRow() — exported function
//   toggleRowSelection() — exported function
//   selectAll() — exported function
//   deselectAll() — exported function
//   getSelectedCount() — exported function
//   toggleRowExpansion() — exported function
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

export function selectRow(token: string, onStateChange?: (state: unknown) => void) {
  localState.selectedIds.add(token);
  onStateChange?.(Store.getState());
}

export function deselectRow(token: string, onStateChange?: (state: unknown) => void) {
  localState.selectedIds.delete(token);
  onStateChange?.(Store.getState());
}

export function toggleRowSelection(token: string, onStateChange?: (state: unknown) => void) {
  if (localState.selectedIds.has(token)) {
    localState.selectedIds.delete(token);
  } else {
    localState.selectedIds.add(token);
  }
  onStateChange?.(Store.getState());
  tracker.selectionChanged(localState.selectedIds.size);
}

export function selectAll(onStateChange?: (state: unknown) => void) {
  Store.getFilteredSessions().forEach(s => {
    if (!s.is_current) localState.selectedIds.add(String(s.session_token || s.id));
  });
  onStateChange?.(Store.getState());
  tracker.selectionChanged(localState.selectedIds.size);
}

export function deselectAll(onStateChange?: (state: unknown) => void) {
  localState.selectedIds.clear();
  onStateChange?.(Store.getState());
  tracker.selectionChanged(0);
}

export function getSelectedCount() {
  return localState.selectedIds.size;
}

export function toggleRowExpansion(token: string, onStateChange?: (state: unknown) => void) {
  if (localState.expandedIds.has(token)) {
    localState.expandedIds.delete(token);
  } else {
    localState.expandedIds.add(token);
  }
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: 'row:expand', token: token?.slice(0, 8), expanded: localState.expandedIds.has(token) });
}

export default { selectRow, deselectRow, toggleRowSelection, selectAll, deselectAll, getSelectedCount, toggleRowExpansion };

export const MODULE_ID = 'panels-panel-session-admin-core-selection';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { selectionReady: true } }; }
