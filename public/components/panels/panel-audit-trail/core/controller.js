import { VERSION, MODULE_ID } from "./constants.js";
import { localState as _localState, initVisibleColumns, resetLocalState, setContainer, setInitialized, isInitialized } from "./state.js";
const localState = _localState;
import { checkAuth } from "./helpers.js";
import * as Store from "../state/store.js";
import * as Renderer from "../ui/renderer.js";
import { startAutoRefresh, stopAutoRefresh } from "./auto-refresh.js";
import { loadData } from "./data.js";
import {
  handleTabChange,
  handleTimePreset,
  handleRefresh,
  handlePrint,
  handleFullscreen,
  handleApplyFilters,
  handleClearFilters,
  handleFilterChange,
  handlePrevPage,
  handleNextPage,
  handleShowDetails,
  handleRowClick,
  handleDensityChange,
  handleSort,
  handleHealthFilter,
  handleToggleAutoRefresh,
  wrappedHandlers
} from "./handlers.js";
initVisibleColumns();
async function init(container) {
  if (isInitialized()) return { ok: true };
  setContainer(container);
  const isAuth = await checkAuth();
  if (!isAuth) return { ok: false, error: "NOT_AUTHENTICATED" };
  setInitialized(true);
  return { ok: true };
}
async function mount() {
  if (!isInitialized() || !localState.container) return { ok: false, error: "NOT_INITIALIZED" };
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
function unmount() {
  stopAutoRefresh();
  Store.unsubscribe(_onStateChange);
  Renderer.unmount();
  resetLocalState();
  initVisibleColumns();
  return { ok: true };
}
function _onStateChange(state) {
  if (!state) return;
  const tab = state.activeTab;
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
function healthCheck() {
  return {
    status: isInitialized() ? "healthy" : "not_initialized",
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
function getVersion() {
  return VERSION;
}
var controller_default = { VERSION, MODULE_ID, init, mount, unmount, getVersion, healthCheck };
export {
  MODULE_ID,
  VERSION,
  controller_default as default,
  getVersion,
  healthCheck,
  init,
  mount,
  unmount
};
