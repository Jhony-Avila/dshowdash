// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: controller
// PURPOSE: Panel Audit Trail - Controller Enterprise Modular
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   localState, initVisibleColumns, resetLocalState, setContainer, setInitialized...
//   checkAuth from ./helpers.js
//   startAutoRefresh, stopAutoRefresh from ./auto-refresh.js
//   loadData from ./data.js
//   handleTabChange, handleTimePreset, handleRefresh, handlePrint, handleFullscre...
//
// PROVIDES:
//   unmount() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { VERSION, MODULE_ID } from './constants.js';
import { localState as _localState, initVisibleColumns, resetLocalState, setContainer, setInitialized, isInitialized } from './state.js';
const localState = _localState as any;
import { checkAuth } from './helpers.js';
import * as Store from '../state/store.js';
import * as Renderer from '../ui/renderer.js';

// Module imports
import { startAutoRefresh, stopAutoRefresh } from './auto-refresh.js';
import { loadData } from './data.js';
import {
  handleTabChange, handleTimePreset, handleRefresh, handlePrint, handleFullscreen,
  handleApplyFilters, handleClearFilters, handleFilterChange,
  handlePrevPage, handleNextPage, handleShowDetails, handleRowClick,
  handleDensityChange, handleSort, handleHealthFilter, handleToggleAutoRefresh,
  wrappedHandlers
} from './handlers.js';

export { VERSION, MODULE_ID };

// Initialize visible columns
initVisibleColumns();

// === INIT ===
export async function init(container: HTMLElement) {
  if (isInitialized()) return { ok: true };
  setContainer(container);
  
  const isAuth = await checkAuth();
  if (!isAuth) return { ok: false, error: 'NOT_AUTHENTICATED' };
  
  setInitialized(true);
  return { ok: true };
}

// === MOUNT ===
export async function mount() {
  if (!isInitialized() || !localState.container) return { ok: false, error: 'NOT_INITIALIZED' };
  
  Renderer.mount(localState.container, {
    onTabChange: handleTabChange,
    onTimePreset: handleTimePreset,
    onRefresh: handleRefresh,
    onPrint: handlePrint,
    onApplyFilters: handleApplyFilters,
    onClearFilters: handleClearFilters,
    onFilterChange: handleFilterChange,
    onPrevPage: handlePrevPage,
    onNextPage: handleNextPage,
    onShowDetails: handleShowDetails,
    onRowClick: handleRowClick,
    onToggleAutoRefresh: handleToggleAutoRefresh,
    onDensityChange: handleDensityChange,
    onSort: handleSort,
    onHealthFilter: handleHealthFilter,
    onFullscreen: handleFullscreen,
    onColumnToggle: wrappedHandlers.handleColumnToggle,
    onToggleInlineFilters: wrappedHandlers.handleToggleInlineFilters,
    onSelectAll: wrappedHandlers.handleSelectAll,
    onRowSelect: wrappedHandlers.handleRowSelect,
    onRowToggleSelect: wrappedHandlers.handleRowToggleSelect,
    onClearSelection: wrappedHandlers.handleClearSelection,
    onBulkExport: wrappedHandlers.handleBulkExport,
    onBulkCopy: wrappedHandlers.handleBulkCopy,
    onInlineFilter: wrappedHandlers.handleInlineFilter,
    onToggleExpand: wrappedHandlers.handleToggleExpand,
    onGroupBy: wrappedHandlers.handleGroupBy,
    onToggleGroup: wrappedHandlers.handleToggleGroup,
    onExportCSV: wrappedHandlers.handleExportCSV,
    onExportJSON: wrappedHandlers.handleExportJSON,
    onExportClipboard: wrappedHandlers.handleExportClipboard,
    onCopyLog: wrappedHandlers.handleCopyLog
  });
  
  Store.subscribe(_onStateChange);
  _onStateChange(Store.getState());
  
  await loadData();
  startAutoRefresh(handleRefresh);
  
  return { ok: true };
}

// === UNMOUNT ===
export function unmount() {
  stopAutoRefresh();
  Store.unsubscribe(_onStateChange);
  Renderer.unmount();
  resetLocalState();
  initVisibleColumns();
  return { ok: true };
}

// === STATE CHANGE ===
function _onStateChange(state: Record<string, unknown>) {
  if (!state) return;
  const tab = state.activeTab as string;
  Renderer.render({
    ...state,
    autoRefresh: { enabled: localState.autoRefreshEnabled, countdown: localState.countdown },
    density: localState.density,
    sort: { key: localState.sortKey, direction: localState.sortDirection },
    showSelection: true,
    showExpand: true,
    selectedIds: localState.selectedIds,
    expandedIds: localState.expandedIds,
    visibleColumns: localState.visibleColumns[tab],
    inlineFiltersActive: localState.inlineFiltersActive,
    groupBy: localState.groupBy,
    collapsedGroups: localState.collapsedGroups
  });
}

// === HEALTH CHECK ===
export function healthCheck() {
  return {
    status: isInitialized() ? 'healthy' : 'not_initialized',
    initialized: isInitialized(),
    autoRefreshEnabled: localState.autoRefreshEnabled,
    selectedCount: localState.selectedIds.size,
    expandedCount: localState.expandedIds.size,
    inlineFiltersActive: localState.inlineFiltersActive,
    groupBy: localState.groupBy,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function getVersion() { return VERSION; }

export default { VERSION, MODULE_ID, init, mount, unmount, getVersion, healthCheck };
