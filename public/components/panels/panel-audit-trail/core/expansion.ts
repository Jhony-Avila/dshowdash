// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-audit-trail-core-expansion
// PURPOSE: Panel Audit Trail - Expansion & Grouping
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   localState from ./state.js
//
// PROVIDES:
//   handleToggleExpand() — exported function
//   handleGroupBy() — exported function
//   handleToggleGroup() — exported function
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
import * as Store from '../state/store.js';
import { localState as _localState } from './state.js';

const localState = _localState as any;

export function handleToggleExpand(logId: string) {
  const isExpanded = localState.expandedIds.has(String(logId));
  if (isExpanded) localState.expandedIds.delete(String(logId));
  else localState.expandedIds.add(String(logId));
  Renderer.toggleRowExpanded(logId, !isExpanded);
}

export function handleGroupBy(groupKey: string, onStateChange: (state: Record<string, unknown>) => void) {
  localState.groupBy = groupKey || '';
  localState.collapsedGroups.clear();
  (Store as any).dispatch({ type: 'SET_GROUP_BY', payload: localState.groupBy });
  onStateChange?.(Store.getState());
  if (localState.groupBy) Renderer.toast(`Agrupado por: ${groupKey}`, 'info');
}

export function handleToggleGroup(groupId: string) {
  if (localState.collapsedGroups.has(groupId)) {
    localState.collapsedGroups.delete(groupId);
  } else {
    localState.collapsedGroups.add(groupId);
  }
  Renderer.toggleGroupCollapsed(groupId, localState.collapsedGroups.has(groupId));
}

export default { handleToggleExpand, handleGroupBy, handleToggleGroup };

export const MODULE_ID = 'panels-panel-audit-trail-core-expansion';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { expansionReady: true } }; }
