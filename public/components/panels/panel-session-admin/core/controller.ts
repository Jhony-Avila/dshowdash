// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: controller
// PURPOSE: Panel Session Admin - Controller Enterprise Modular
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   localState, resetLocalState, setContainer, setConfig, setInitialized, isIniti...
//   refresh, terminateSession, terminateAllOthers, terminateSelected, retry from ...
//   setFilter, clearFilters, toggleInlineFilters, setInlineFilter, getFilteredWit...
//   toggleColumn, showAllColumns, resetColumns from ./columns.js
//   selectRow, deselectRow, toggleRowSelection, selectAll, deselectAll, getSelect...
//   showDetails, closeDetails, copySessionToken from ./modals.js
//   startAutoRefresh, stopAutoRefresh, toggleAutoRefresh from ./auto-refresh.js
//   exportCSV, exportJSON, copyToClipboard, printSessions from ./exporter.js
//   setupKeyboardShortcuts, removeKeyboardShortcuts from ./keyboard.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   unmount() — exported function
//   toggleFullscreen() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   refresh — exported value
//   terminateSession — exported value
//   terminateAllOthers — exported value
//   terminateSelected — exported value
//   setFilter — exported value
//   clearFilters — exported value
//   toggleInlineFilters — exported value
//   setInlineFilter — exported value
//   toggleColumn — exported value
//   ... and 18 more exports
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
import { localState, resetLocalState, setContainer, setConfig, setInitialized, isInitialized } from './state.js';
import * as Store from '../state/store.js';
import * as Events from '../ui/events.js';
import * as Template from '../ui/template.js';
import tracker from '../telemetry/tracker.js';

// Module imports
import { refresh, terminateSession, terminateAllOthers, terminateSelected, retry } from './data.js';
import { setFilter, clearFilters, toggleInlineFilters, setInlineFilter, getFilteredWithInline } from './filters.js';
import { toggleColumn, showAllColumns, resetColumns } from './columns.js';
import { selectRow, deselectRow, toggleRowSelection, selectAll, deselectAll, getSelectedCount, toggleRowExpansion } from './selection.js';
import { showDetails, closeDetails, copySessionToken } from './modals.js';
import { startAutoRefresh, stopAutoRefresh, toggleAutoRefresh } from './auto-refresh.js';
import { exportCSV, exportJSON, copyToClipboard, printSessions } from './exporter.js';
import { setupKeyboardShortcuts, removeKeyboardShortcuts } from './keyboard.js';

export { VERSION, MODULE_ID };

// === INIT ===
export async function init(container: HTMLElement, config: Record<string, unknown> = {}) {
  if (isInitialized()) return { ok: true };
  
  setContainer(container);
  setConfig(config);
  
  const authResult = Store.ensureAuth();
  if (!authResult.ok) {
    tracker.authRequired('init');
    return { ok: false, error: 'NOT_AUTHENTICATED' };
  }
  
  setInitialized(true);
  return { ok: true };
}

// === MOUNT ===
export async function mount() {
  if (!isInitialized() || !localState.container) return { ok: false, error: 'NOT_INITIALIZED' };
  
  // @ts-expect-error strict migration — TS2345
  Events.setup(localState.container, Store.getState(), _getHandlers(), localState.config);
  Store.subscribe(_onStateChange);
  _onStateChange(Store.getState());
  await refresh();
  // @ts-expect-error strict migration — TS2345
  setupKeyboardShortcuts({ onStateChange: () => _onStateChange(Store.getState()), toggleFullscreen, toggleInlineFilters: () => toggleInlineFilters(_onStateChange) });
  
  return { ok: true };
}

// === UNMOUNT ===
export function unmount() {
  stopAutoRefresh();
  removeKeyboardShortcuts();
  Events.destroy();
  // @(ts as any)-ignore
  (Store as any).reset();
  resetLocalState();
  return { ok: true };
}

// === FULLSCREEN ===
export function toggleFullscreen() {
  localState.isFullscreen = !localState.isFullscreen;
  const panel = localState.container?.querySelector('.psa');
  if (panel) panel.classList.toggle('psa--fullscreen', localState.isFullscreen);
  tracker.fullscreenToggle(localState.isFullscreen);
  _onStateChange(Store.getState());
  return localState.isFullscreen;
}

// === STATE CHANGE ===
function _onStateChange(state: Record<string, unknown>) {
  if (!state) return;
  if (!localState.container) return;
  
  const filteredSessions = getFilteredWithInline();
  

  // @ts-expect-error TS migration - TS2339
  Template.render(localState.container, {
    isAdmin: state.isAdmin,
    loading: state.loading,
    error: state.error,
    filter: state.filter,
    filteredSessions,
    allSessions: Store.getSessions(),
    confirmModal: Store.getConfirmModal(),
    selectedIds: localState.selectedIds,
    selectedCount: localState.selectedIds.size,
    expandedIds: localState.expandedIds,
    hiddenCols: localState.hiddenCols,
    showInlineFilters: localState.showInlineFilters,
    inlineFilters: localState.inlineFilters,
    autoRefreshEnabled: localState.autoRefreshEnabled,
    countdown: localState.countdown,
    isFullscreen: localState.isFullscreen
  }, localState.config);
  
  // @ts-expect-error strict migration — TS2345
  Events.setup(localState.container, state, _getHandlers(), localState.config);
}

// === HANDLERS ===
function _getHandlers() {
  const onStateChange = () => _onStateChange(Store.getState());
  
  return {
    refresh, retry,
    setFilter, clearFilters,
    terminateSession, terminateAllOthers, terminateSelected,
    toggleAutoRefresh: () => toggleAutoRefresh(onStateChange),
    exportCSV, exportJSON, copyToClipboard, printSessions,
    toggleFullscreen,
    selectRow: (t: string) => selectRow(t, onStateChange),
    deselectRow: (t: string) => deselectRow(t, onStateChange),
    toggleRowSelection: (t: string) => toggleRowSelection(t, onStateChange),
    selectAll: () => selectAll(onStateChange),
    deselectAll: () => deselectAll(onStateChange),
    getSelectedCount,
    toggleInlineFilters: () => toggleInlineFilters(onStateChange),
    setInlineFilter: (k: string, v: string) => setInlineFilter(k, v, onStateChange),
    toggleColumn: (c: string, v: boolean) => toggleColumn(c, v, onStateChange),
    showAllColumns: () => showAllColumns(onStateChange),
    resetColumns: () => resetColumns(onStateChange),
    toggleRowExpansion: (t: string) => toggleRowExpansion(t, onStateChange),
    showDetails, closeDetails, copySessionToken
  };
}

// === HEALTH CHECK ===
export function healthCheck() {
  return {
    status: isInitialized() ? 'healthy' : 'not_initialized',
    initialized: isInitialized(),
    hasContainer: !!localState.container,
    autoRefreshEnabled: localState.autoRefreshEnabled,
    countdown: localState.countdown,
    isFullscreen: localState.isFullscreen,
    selectedCount: localState.selectedIds.size,
    expandedCount: localState.expandedIds.size,
    hiddenColsCount: localState.hiddenCols.size,
    showInlineFilters: localState.showInlineFilters,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function getVersion() { return VERSION; }

// Re-exports
export { refresh, terminateSession, terminateAllOthers, terminateSelected };
export { setFilter, clearFilters, toggleInlineFilters, setInlineFilter };
export { toggleColumn, showAllColumns, resetColumns };
export { selectRow, deselectRow, toggleRowSelection, selectAll, deselectAll, getSelectedCount, toggleRowExpansion };
export { showDetails, closeDetails, copySessionToken };
export { startAutoRefresh, toggleAutoRefresh };
export { exportCSV, exportJSON, copyToClipboard, printSessions };

export default {
  VERSION, MODULE_ID,
  init, mount, unmount, refresh,
  terminateSession, terminateAllOthers, terminateSelected,
  setFilter, clearFilters, toggleInlineFilters, setInlineFilter,
  toggleColumn, showAllColumns, resetColumns,
  toggleRowExpansion, showDetails, closeDetails, copySessionToken,
  startAutoRefresh, toggleAutoRefresh,
  exportCSV, exportJSON, copyToClipboard, printSessions,
  toggleFullscreen,
  selectRow, deselectRow, toggleRowSelection, selectAll, deselectAll, getSelectedCount,
  healthCheck, getVersion
};
