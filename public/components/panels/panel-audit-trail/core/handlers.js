import { TABS, TIME_PRESETS } from "./contracts.js";
import * as _Store from "../state/store.js";
import * as _Renderer from "../ui/renderer.js";
import * as _Template from "../ui/template.js";
import { localState as _localState } from "./state.js";
const Store = _Store;
const Renderer = _Renderer;
const Template = _Template;
const localState = _localState;
import { getCurrentLogs } from "./helpers.js";
import { AUTO_REFRESH_SECONDS } from "./constants.js";
import { loadData } from "./data.js";
import { toggleAutoRefresh } from "./auto-refresh.js";
import { handleSelectAll, handleRowSelect, handleRowToggleSelect, handleClearSelection } from "./selection.js";
import { handleToggleExpand, handleGroupBy, handleToggleGroup } from "./expansion.js";
import { handleColumnToggle, handleToggleInlineFilters, handleInlineFilter } from "./columns.js";
import { handleExportCSV, handleExportJSON, handleExportClipboard, handleBulkExport, handleBulkCopy, handleCopyLog } from "./export.js";
async function handleTabChange(tab) {
  Store.dispatch({ type: "SET_TAB", payload: tab });
  localState.selectedIds.clear();
  localState.expandedIds.clear();
  localState.inlineFilterValues = {};
  Renderer.clearInlineFilters();
  Renderer.updateColumnsMenu(tab, localState.visibleColumns[tab]);
  await loadData();
}
async function handleTimePreset(preset) {
  if (TIME_PRESETS[preset]) {
    Store.dispatch({ type: "SET_FILTERS", payload: { timePreset: preset } });
    await loadData();
  }
}
async function handleRefresh(silent = false) {
  localState.countdown = AUTO_REFRESH_SECONDS;
  await loadData();
  if (!silent) Renderer.toast("Dados atualizados", "success");
}
function handlePrint() {
  window.print();
}
function handleFullscreen() {
  localState.isFullscreen = !localState.isFullscreen;
  Renderer.setFullscreen(localState.isFullscreen);
  Renderer.toast(localState.isFullscreen ? "Modo tela cheia" : "Modo normal", "info");
}
async function handleApplyFilters() {
  await loadData();
  Renderer.toast("Filtros aplicados", "success");
}
function handleClearFilters() {
  Store.dispatch({ type: "CLEAR_FILTERS" });
  localState.inlineFilterValues = {};
  Renderer.clearInlineFilters();
  loadData();
  Renderer.toast("Filtros limpos", "info");
}
function handleFilterChange(key, value) {
  Store.dispatch({ type: "SET_FILTERS", payload: { [key]: value } });
}
async function handlePrevPage() {
  const state = Store.getState();
  const newOffset = Math.max(0, state.pagination.offset - state.pagination.limit);
  Store.dispatch({ type: "SET_PAGINATION", payload: { offset: newOffset } });
  await loadData();
}
async function handleNextPage() {
  const state = Store.getState();
  const newOffset = state.pagination.offset + state.pagination.limit;
  if (newOffset < state.pagination.total) {
    Store.dispatch({ type: "SET_PAGINATION", payload: { offset: newOffset } });
    await loadData();
  }
}
async function handleShowDetails(logId) {
  const state = Store.getState();
  const logs = getCurrentLogs(state);
  const log = logs?.find((l) => String(l.id) === String(logId));
  if (log) await Template.showDetailModal(log);
}
function handleRowClick(logId) {
  handleToggleExpand(logId);
}
function handleDensityChange(density) {
  localState.density = density;
  Renderer.setDensity(density);
  Renderer.toast(`Densidade: ${density}`, "info");
}
async function handleSort(key) {
  if (localState.sortKey === key) {
    localState.sortDirection = localState.sortDirection === "asc" ? "desc" : "asc";
  } else {
    localState.sortKey = key;
    localState.sortDirection = "desc";
  }
  Store.dispatch({ type: "SET_SORT", payload: { key: localState.sortKey, direction: localState.sortDirection } });
  Renderer.setSortingState(localState.sortKey, localState.sortDirection);
  await loadData();
}
function handleHealthFilter(type) {
  if (type === "security") {
    Store.dispatch({ type: "SET_TAB", payload: TABS.SECURITY });
  } else {
    Store.dispatch({ type: "SET_TAB", payload: TABS.FRONTEND });
    Store.dispatch({ type: "SET_FILTERS", payload: { severity: type } });
  }
  loadData();
}
function handleToggleAutoRefresh() {
  toggleAutoRefresh(handleRefresh);
}
const wrappedHandlers = {
  handleSelectAll: (checked) => handleSelectAll(checked, Store.getState()),
  handleRowSelect,
  handleRowToggleSelect,
  handleClearSelection,
  handleToggleExpand,
  handleGroupBy: (key) => handleGroupBy(key, (_s) => {
  }),
  handleToggleGroup,
  handleColumnToggle,
  handleToggleInlineFilters,
  handleInlineFilter: (col, val) => handleInlineFilter(col, val, loadData),
  handleExportCSV: () => handleExportCSV(Store.getState()),
  handleExportJSON: () => handleExportJSON(Store.getState()),
  handleExportClipboard: () => handleExportClipboard(Store.getState()),
  handleBulkExport: () => handleBulkExport(Store.getState()),
  handleBulkCopy: () => handleBulkCopy(Store.getState()),
  handleCopyLog: (id) => handleCopyLog(id, Store.getState())
};
var handlers_default = {
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
};
const MODULE_ID = "panels-panel-audit-trail-core-handlers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { handlersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  handlers_default as default,
  handleApplyFilters,
  handleClearFilters,
  handleDensityChange,
  handleFilterChange,
  handleFullscreen,
  handleHealthFilter,
  handleNextPage,
  handlePrevPage,
  handlePrint,
  handleRefresh,
  handleRowClick,
  handleShowDetails,
  handleSort,
  handleTabChange,
  handleTimePreset,
  handleToggleAutoRefresh,
  healthCheck,
  info,
  wrappedHandlers
};
