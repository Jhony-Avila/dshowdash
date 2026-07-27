// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-audit-trail-core-columns
// PURPOSE: Panel Audit Trail - Columns & Inline Filters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   localState from ./state.js
//
// PROVIDES:
//   handleColumnToggle() — exported function
//   handleToggleInlineFilters() — exported function
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
import { localState } from './state.js';

export function handleColumnToggle(colKey: string, visible: boolean) {
  const state = Store.getState();
  const tab = state.activeTab as string;
  if (visible) {
    if (!(localState as any).visibleColumns[tab].includes(colKey)) {
      (localState as any).visibleColumns[tab].push(colKey);
    }
  } else {
    (localState as any).visibleColumns[tab] = (localState as any).visibleColumns[tab].filter((k: string) => k !== colKey);
  }
  Renderer.setColumnVisibility(colKey, visible);
}

export function handleToggleInlineFilters() {

  // @ts-expect-error TS migration - TS2339
  localState.inlineFiltersActive = !localState.inlineFiltersActive;
  Renderer.setInlineFiltersActive((localState as any).inlineFiltersActive);

  // @ts-expect-error TS migration - TS2339
  (Renderer as any).toast(localState.inlineFiltersActive ? 'Filtros inline ativos' : 'Filtros inline desativados', 'info');
}

export async function handleInlineFilter(col: string, value: string, loadData?: () => Promise<void>) {

  // @ts-expect-error TS migration - TS2339
  localState.inlineFilterValues[col] = value;
  Renderer.setInlineFilterValue(col, value);
  Store.dispatch({ type: 'SET_FILTERS', payload: { [`inline_${col}`]: value } });
  await loadData?.();
}

export default { handleColumnToggle, handleToggleInlineFilters, handleInlineFilter };

export const MODULE_ID = 'panels-panel-audit-trail-core-columns';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { columnsReady: true } }; }
