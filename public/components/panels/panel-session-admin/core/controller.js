import { VERSION, MODULE_ID } from "./constants.js";
import { localState, resetLocalState, setContainer, setConfig, setInitialized, isInitialized } from "./state.js";
import * as Store from "../state/store.js";
import * as Events from "../ui/events.js";
import * as Template from "../ui/template.js";
import tracker from "../telemetry/tracker.js";
import { refresh, terminateSession, terminateAllOthers, terminateSelected, retry } from "./data.js";
import { setFilter, clearFilters, toggleInlineFilters, setInlineFilter, getFilteredWithInline } from "./filters.js";
import { toggleColumn, showAllColumns, resetColumns } from "./columns.js";
import { selectRow, deselectRow, toggleRowSelection, selectAll, deselectAll, getSelectedCount, toggleRowExpansion } from "./selection.js";
import { showDetails, closeDetails, copySessionToken } from "./modals.js";
import { startAutoRefresh, stopAutoRefresh, toggleAutoRefresh } from "./auto-refresh.js";
import { exportCSV, exportJSON, copyToClipboard, printSessions } from "./exporter.js";
import { setupKeyboardShortcuts, removeKeyboardShortcuts } from "./keyboard.js";
async function init(container, config = {}) {
  if (isInitialized()) return { ok: true };
  setContainer(container);
  setConfig(config);
  const authResult = Store.ensureAuth();
  if (!authResult.ok) {
    tracker.authRequired("init");
    return { ok: false, error: "NOT_AUTHENTICATED" };
  }
  setInitialized(true);
  return { ok: true };
}
async function mount() {
  if (!isInitialized() || !localState.container) return { ok: false, error: "NOT_INITIALIZED" };
  Events.setup(localState.container, Store.getState(), _getHandlers(), localState.config);
  Store.subscribe(_onStateChange);
  _onStateChange(Store.getState());
  await refresh();
  setupKeyboardShortcuts({ onStateChange: () => _onStateChange(Store.getState()), toggleFullscreen, toggleInlineFilters: () => toggleInlineFilters(_onStateChange) });
  return { ok: true };
}
function unmount() {
  stopAutoRefresh();
  removeKeyboardShortcuts();
  Events.destroy();
  Store.reset();
  resetLocalState();
  return { ok: true };
}
function toggleFullscreen() {
  localState.isFullscreen = !localState.isFullscreen;
  const panel = localState.container?.querySelector(".psa");
  if (panel) panel.classList.toggle("psa--fullscreen", localState.isFullscreen);
  tracker.fullscreenToggle(localState.isFullscreen);
  _onStateChange(Store.getState());
  return localState.isFullscreen;
}
function _onStateChange(state) {
  if (!state) return;
  if (!localState.container) return;
  const filteredSessions = getFilteredWithInline();
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
  Events.setup(localState.container, state, _getHandlers(), localState.config);
}
function _getHandlers() {
  const onStateChange = () => _onStateChange(Store.getState());
  return {
    refresh,
    retry,
    setFilter,
    clearFilters,
    terminateSession,
    terminateAllOthers,
    terminateSelected,
    toggleAutoRefresh: () => toggleAutoRefresh(onStateChange),
    exportCSV,
    exportJSON,
    copyToClipboard,
    printSessions,
    toggleFullscreen,
    selectRow: (t) => selectRow(t, onStateChange),
    deselectRow: (t) => deselectRow(t, onStateChange),
    toggleRowSelection: (t) => toggleRowSelection(t, onStateChange),
    selectAll: () => selectAll(onStateChange),
    deselectAll: () => deselectAll(onStateChange),
    getSelectedCount,
    toggleInlineFilters: () => toggleInlineFilters(onStateChange),
    setInlineFilter: (k, v) => setInlineFilter(k, v, onStateChange),
    toggleColumn: (c, v) => toggleColumn(c, v, onStateChange),
    showAllColumns: () => showAllColumns(onStateChange),
    resetColumns: () => resetColumns(onStateChange),
    toggleRowExpansion: (t) => toggleRowExpansion(t, onStateChange),
    showDetails,
    closeDetails,
    copySessionToken
  };
}
function healthCheck() {
  return {
    status: isInitialized() ? "healthy" : "not_initialized",
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
function getVersion() {
  return VERSION;
}
var controller_default = {
  VERSION,
  MODULE_ID,
  init,
  mount,
  unmount,
  refresh,
  terminateSession,
  terminateAllOthers,
  terminateSelected,
  setFilter,
  clearFilters,
  toggleInlineFilters,
  setInlineFilter,
  toggleColumn,
  showAllColumns,
  resetColumns,
  toggleRowExpansion,
  showDetails,
  closeDetails,
  copySessionToken,
  startAutoRefresh,
  toggleAutoRefresh,
  exportCSV,
  exportJSON,
  copyToClipboard,
  printSessions,
  toggleFullscreen,
  selectRow,
  deselectRow,
  toggleRowSelection,
  selectAll,
  deselectAll,
  getSelectedCount,
  healthCheck,
  getVersion
};
export {
  MODULE_ID,
  VERSION,
  clearFilters,
  closeDetails,
  copySessionToken,
  copyToClipboard,
  controller_default as default,
  deselectAll,
  deselectRow,
  exportCSV,
  exportJSON,
  getSelectedCount,
  getVersion,
  healthCheck,
  init,
  mount,
  printSessions,
  refresh,
  resetColumns,
  selectAll,
  selectRow,
  setFilter,
  setInlineFilter,
  showAllColumns,
  showDetails,
  startAutoRefresh,
  terminateAllOthers,
  terminateSelected,
  terminateSession,
  toggleAutoRefresh,
  toggleColumn,
  toggleFullscreen,
  toggleInlineFilters,
  toggleRowExpansion,
  toggleRowSelection,
  unmount
};
