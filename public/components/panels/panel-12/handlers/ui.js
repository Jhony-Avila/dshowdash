import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import * as store from "../state/store.js";
import * as persist from "../state/persist.js";
import * as table from "../ui/table.js";
import * as tooltip from "../ui/tooltip.js";
import * as modals from "../ui/modals.js";
import * as toast from "../ui/toast.js";
import * as panelHeader from "../ui/header.js";
import * as logger from "../utils/logger.js";
import { ALL_COLUMNS } from "../config/columns.js";
import { state, resetState, PANEL_ID } from "../core/lifecycle.js";
import { SEARCH_DEBOUNCE_MS } from "../core/constants.js";
const MODULE_ID = "panel-12.handlers.ui";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function handleSort(container, column, headerElement, callbacks) {
  const { setupTooltipsWrapper, setupDelegatedEventListeners } = callbacks;
  const timer = logger.startTimer("sort.apply");
  const newSort = store.toggleSort(column);
  persist.setSortState(newSort);
  const filtered = store.getFilteredAndSorted();
  table.render(container, filtered, ALL_COLUMNS, (c, col, el) => handleSort(c, col, el, callbacks), setupTooltipsWrapper, setupDelegatedEventListeners, panelHeader.applyDensity, PANEL_ID);
  panelHeader.updateFilterCounts(container);
  if (headerElement?.blur) headerElement.blur();
  timer.end({ column, direction: newSort.direction });
  const telemetry = _getPort("telemetry");
  if (telemetry) telemetry.track?.("painel-12:sort:applied", { column, direction: newSort.direction });
}
function handleSearchChange(value, callbacks) {
  if (state.searchDebounceTimer) clearTimeout(state.searchDebounceTimer);
  state.searchDebounceTimer = setTimeout(() => {
    store.setSearchTerm(value);
    const container = document.querySelector(`#${PANEL_ID}`);
    if (!container) return;
    const filtered = store.getFilteredAndSorted();
    const { setupTooltipsWrapper, setupDelegatedEventListeners } = callbacks;
    table.render(container, filtered, ALL_COLUMNS, (c, col, el) => handleSort(c, col, el, callbacks), setupTooltipsWrapper, setupDelegatedEventListeners, panelHeader.applyDensity, PANEL_ID);
    panelHeader.updateSearchResults(container, filtered.length, store.getJobs().length, PANEL_ID);
    panelHeader.updateFilterCounts(container);
    logger.debug("search.change", { term: value.substring(0, 50), termLength: value.length, results: filtered.length, total: store.getJobs().length });
    const telemetry = _getPort("telemetry");
    if (telemetry) telemetry.track?.("painel-12:search:applied", { termLength: value.length, results: filtered.length });
  }, SEARCH_DEBOUNCE_MS);
}
function handleSearchClear(callbacks) {
  if (state.searchDebounceTimer) {
    clearTimeout(state.searchDebounceTimer);
    state.searchDebounceTimer = null;
  }
  store.resetSearch();
  const container = document.querySelector(`#${PANEL_ID}`);
  if (!container) return;
  const filtered = store.getFilteredAndSorted();
  const { setupTooltipsWrapper, setupDelegatedEventListeners } = callbacks;
  table.render(container, filtered, ALL_COLUMNS, (c, col, el) => handleSort(c, col, el, callbacks), setupTooltipsWrapper, setupDelegatedEventListeners, panelHeader.applyDensity, PANEL_ID);
  panelHeader.updateSearchResults(container, filtered.length, store.getJobs().length, PANEL_ID);
  panelHeader.updateFilterCounts(container);
  const telemetry = _getPort("telemetry");
  if (telemetry) telemetry.track?.("painel-12:search:cleared", {});
}
function handleFilterChange(filterType, filterValue, callbacks) {
  store.setFilters({ [filterType]: filterValue });
  const container = document.querySelector(`#${PANEL_ID}`);
  if (!container) return;
  const filtered = store.getFilteredAndSorted();
  const { setupTooltipsWrapper, setupDelegatedEventListeners } = callbacks;
  table.render(container, filtered, ALL_COLUMNS, (c, col, el) => handleSort(c, col, el, callbacks), setupTooltipsWrapper, setupDelegatedEventListeners, panelHeader.applyDensity, PANEL_ID);
  panelHeader.updateFilterCounts(container);
  logger.debug("filter.change", { filterType, filterValue, results: filtered.length });
  const telemetry = _getPort("telemetry");
  if (telemetry) telemetry.track?.("painel-12:filter:applied", { filterType, filterValue, results: filtered.length });
}
function cleanup(container) {
  panelHeader.cleanup();
  if (state.abortController) {
    state.abortController.abort();
    state.abortController = null;
  }
  if (state.intervalId) {
    clearTimeout(state.intervalId);
    state.intervalId = null;
  }
  if (state.searchDebounceTimer) {
    clearTimeout(state.searchDebounceTimer);
    state.searchDebounceTimer = null;
  }
  tooltip.hide();
  modals.cleanup();
  if (state.retryToast) {
    toast.hide(state.retryToast);
    state.retryToast = null;
  }
  if (container) container.innerHTML = "";
  store.resetAll();
  resetState();
  logger.debug("lifecycle.unmount.complete", { cleaned: true });
  const telemetry = _getPort("telemetry");
  if (telemetry) telemetry.track?.("painel-12:lifecycle:unmounted", {});
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { uiReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  cleanup,
  getPorts,
  handleFilterChange,
  handleSearchChange,
  handleSearchClear,
  handleSort,
  healthCheck,
  info,
  injectPorts
};
