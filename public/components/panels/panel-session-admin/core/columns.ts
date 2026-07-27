// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-core-columns
// PURPOSE: Panel Session Admin - Columns
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   localState, DEFAULT_HIDDEN_COLS from ./state.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   toggleColumn() — exported function
//   showAllColumns() — exported function
//   resetColumns() — exported function
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

// @ts-expect-error TS migration - TS2614
import { localState, DEFAULT_HIDDEN_COLS } from './state.js';

export function toggleColumn(col: string, visible: boolean, onStateChange?: (state: unknown) => void) {
  if (visible) {
    localState.hiddenCols.delete(col);
  } else {
    localState.hiddenCols.add(col);
  }
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: 'column:toggle', col, visible });
}

export function showAllColumns(onStateChange?: (state: unknown) => void) {
  localState.hiddenCols.clear();
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: 'columns:show-all' });
}

export function resetColumns(onStateChange?: (state: unknown) => void) {
  localState.hiddenCols = new Set(DEFAULT_HIDDEN_COLS);
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: 'columns:reset' });
}

export default { toggleColumn, showAllColumns, resetColumns };

export const MODULE_ID = 'panels-panel-session-admin-core-columns';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { columnsReady: true } }; }
