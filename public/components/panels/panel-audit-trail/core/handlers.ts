// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-audit-trail-core-handlers
// PURPOSE: Panel Audit Trail - Event Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABS, TIME_PRESETS from ./contracts.js
//   localState from ./state.js
//   getCurrentLogs from ./helpers.js
//   AUTO_REFRESH_SECONDS from ./constants.js
//   loadData from ./data.js
//   toggleAutoRefresh from ./auto-refresh.js
//   handleSelectAll, handleRowSelect, handleRowToggleSelect, handleClearSelection...
//   handleToggleExpand, handleGroupBy, handleToggleGroup from ./expansion.js
//   handleColumnToggle, handleToggleInlineFilters, handleInlineFilter from ./colu...
//   handleExportCSV, handleExportJSON, handleExportClipboard, handleBulkExport, h...
//
// PROVIDES:
//   handlePrint() — exported function
//   handleFullscreen() — exported function
//   handleClearFilters() — exported function
//   handleFilterChange() — exported function
//   handleRowClick() — exported function
//   handleDensityChange() — exported function
//   handleHealthFilter() — exported function
//   handleToggleAutoRefresh() — exported function
//   wrappedHandlers — exported value
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
//   window.print
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABS, TIME_PRESETS } from './contracts.js';
import * as _Store from '../state/store.js';
import * as _Renderer from '../ui/renderer.js';
import * as _Template from '../ui/template.js';
import { localState as _localState } from './state.js';
const Store = _Store as any;
const Renderer = _Renderer as any;
const Template = _Template as any;
const localState: Record<string, any> = _localState as any;
import { getCurrentLogs } from './helpers.js';
import { AUTO_REFRESH_SECONDS } from './constants.js';
import { loadData } from './data.js';
import { toggleAutoRefresh } from './auto-refresh.js';
import { handleSelectAll, handleRowSelect, handleRowToggleSelect, handleClearSelection } from './selection.js';
import { handleToggleExpand, handleGroupBy, handleToggleGroup } from './expansion.js';
import { handleColumnToggle, handleToggleInlineFilters, handleInlineFilter } from './columns.js';
import { handleExportCSV, handleExportJSON, handleExportClipboard, handleBulkExport, handleBulkCopy, handleCopyLog } from './export.js';

export async function handleTabChange(tab: string) {
  Store.dispatch({ type: 'SET_TAB', payload: tab });
  localState.selectedIds.clear();
  localState.expandedIds.clear();
  localState.inlineFilterValues = {};
  Renderer.clearInlineFilters();
  Renderer.updateColumnsMenu(tab, localState.visibleColumns[tab]);
  await loadData();
}

export async function handleTimePreset(preset: string) {
  if ((TIME_PRESETS as Record<string, unknown>)[preset]) {
    Store.dispatch({ type: 'SET_FILTERS', payload: { timePreset: preset } });
    await loadData();
  }
}

export async function handleRefresh(silent = false) {
  localState.countdown = AUTO_REFRESH_SECONDS;
  await loadData();
  if (!silent) Renderer.toast('Dados atualizados', 'success');
}

export function handlePrint() { window.print(); }

export function handleFullscreen() {
  localState.isFullscreen = !localState.isFullscreen;
  Renderer.setFullscreen(localState.isFullscreen);
  Renderer.toast(localState.isFullscreen ? 'Modo tela cheia' : 'Modo normal', 'info');
}

export async function handleApplyFilters() {
  await loadData();
  Renderer.toast('Filtros aplicados', 'success');
}

export function handleClearFilters() {
  Store.dispatch({ type: 'CLEAR_FILTERS' });
  localState.inlineFilterValues = {};
  Renderer.clearInlineFilters();
  loadData();
  Renderer.toast('Filtros limpos', 'info');
}

export function handleFilterChange(key: string, value: string) {
  Store.dispatch({ type: 'SET_FILTERS', payload: { [key]: value } });
}

export async function handlePrevPage() {
  const state = Store.getState();
  const newOffset = Math.max(0, state.pagination.offset - state.pagination.limit);
  Store.dispatch({ type: 'SET_PAGINATION', payload: { offset: newOffset } });
  await loadData();
}

export async function handleNextPage() {
  const state = Store.getState();
  const newOffset = state.pagination.offset + state.pagination.limit;
  if (newOffset < state.pagination.total) {
    Store.dispatch({ type: 'SET_PAGINATION', payload: { offset: newOffset } });
    await loadData();
  }
}

export async function handleShowDetails(logId: string) {
  const state = Store.getState();
  const logs = getCurrentLogs(state) as Record<string, unknown>[] | undefined;
  const log = logs?.find((l: Record<string, unknown>) => String(l.id) === String(logId));
  if (log) await Template.showDetailModal(log);
}

export function handleRowClick(logId: string) { handleToggleExpand(logId); }

export function handleDensityChange(density: string) {
  localState.density = density;
  Renderer.setDensity(density);
  Renderer.toast(`Densidade: ${density}`, 'info');
}

export async function handleSort(key: string) {
  if (localState.sortKey === key) {
    localState.sortDirection = localState.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    localState.sortKey = key;
    localState.sortDirection = 'desc';
  }
  Store.dispatch({ type: 'SET_SORT', payload: { key: localState.sortKey, direction: localState.sortDirection } });
  Renderer.setSortingState(localState.sortKey, localState.sortDirection);
  await loadData();
}

export function handleHealthFilter(type: string) {
  if (type === 'security') {
    Store.dispatch({ type: 'SET_TAB', payload: TABS.SECURITY });
  } else {
    Store.dispatch({ type: 'SET_TAB', payload: TABS.FRONTEND });
    Store.dispatch({ type: 'SET_FILTERS', payload: { severity: type } });
  }
  loadData();
}

export function handleToggleAutoRefresh() {
  toggleAutoRefresh(handleRefresh);
}

// Re-export wrapped handlers
export const wrappedHandlers = {
  handleSelectAll: (checked: boolean) => handleSelectAll(checked, Store.getState()),
  handleRowSelect,
  handleRowToggleSelect,
  handleClearSelection,
  handleToggleExpand,
  handleGroupBy: (key: string) => handleGroupBy(key, (_s: Record<string, unknown>) => {}),
  handleToggleGroup,
  handleColumnToggle,
  handleToggleInlineFilters,
  handleInlineFilter: (col: string, val: string) => handleInlineFilter(col, val, loadData),
  handleExportCSV: () => handleExportCSV(Store.getState()),
  handleExportJSON: () => handleExportJSON(Store.getState()),
  handleExportClipboard: () => handleExportClipboard(Store.getState()),
  handleBulkExport: () => handleBulkExport(Store.getState()),
  handleBulkCopy: () => handleBulkCopy(Store.getState()),
  handleCopyLog: (id: string) => handleCopyLog(id, Store.getState())
};

export default {
  handleTabChange, handleTimePreset, handleRefresh, handlePrint, handleFullscreen,
  handleApplyFilters, handleClearFilters, handleFilterChange,
  handlePrevPage, handleNextPage, handleShowDetails, handleRowClick,
  handleDensityChange, handleSort, handleHealthFilter, handleToggleAutoRefresh,
  wrappedHandlers
};

export const MODULE_ID = 'panels-panel-audit-trail-core-handlers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { handlersReady: true } }; }
