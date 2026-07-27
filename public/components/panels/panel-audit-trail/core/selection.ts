// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-audit-trail-core-selection
// PURPOSE: Panel Audit Trail - Selection
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   localState from ./state.js
//   getCurrentLogs from ./helpers.js
//
// PROVIDES:
//   handleSelectAll() — exported function
//   handleRowSelect() — exported function
//   handleRowToggleSelect() — exported function
//   handleClearSelection() — exported function
//   updateSelectAllState() — exported function
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

import * as Renderer from '../ui/renderer.js';
import { localState } from './state.js';
import { getCurrentLogs } from './helpers.js';

export function handleSelectAll(checked: boolean, state: Record<string, unknown>) {
  const logs = getCurrentLogs(state);

  // @ts-expect-error TS migration - TS2339
  localState.selectedIds.clear();
  if (checked && logs) {

    // @ts-expect-error TS migration - TS2339
    logs.forEach(log => localState.selectedIds.add(String(log.id)));
  }
  Renderer.setAllRowsSelected(checked);

  // @ts-expect-error TS migration - TS2339
  Renderer.setSelectedCount(localState.selectedIds.size);
}

export function handleRowSelect(logId: string, checked: boolean) {

  // @ts-expect-error TS migration - TS2339
  if (checked) localState.selectedIds.add(String(logId));
  else (localState as any).selectedIds.delete(String(logId));
  Renderer.setRowSelected(logId, checked);

  // @ts-expect-error TS migration - TS2339
  Renderer.setSelectedCount(localState.selectedIds.size);
}

export function handleRowToggleSelect(logId: string) {

  // @ts-expect-error TS migration - TS2339
  handleRowSelect(logId, !localState.selectedIds.has(String(logId)));
}

export function handleClearSelection() {

  // @ts-expect-error TS migration - TS2339
  localState.selectedIds.clear();
  Renderer.setAllRowsSelected(false);
  Renderer.setSelectedCount(0);
}

export function updateSelectAllState(state: Record<string, unknown>) {
  const logs = getCurrentLogs(state);

  // @ts-expect-error TS migration - TS2339
  const allSelected = logs?.length > 0 && logs.every(l => localState.selectedIds.has(String(l.id)));
  Renderer.updateSelectAllState(allSelected, (localState as any).selectedIds.size > 0);
}

export default { handleSelectAll, handleRowSelect, handleRowToggleSelect, handleClearSelection, updateSelectAllState };

export const MODULE_ID = 'panels-panel-audit-trail-core-selection';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { selectionReady: true } }; }
