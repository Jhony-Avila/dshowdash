import { EventBusPort } from "../ports/index.js";
import { handleSort } from "./sorting.js";
import { PANEL_16_UI_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
let _abortController = null;
let _listenerCount = 0;
function bindEvents(container, state, handlers) {
  unbindAllEvents();
  _abortController = new AbortController();
  const signal = _abortController.signal;
  _listenerCount = 0;
  container.addEventListener("click", (e) => handleClick(e, state, handlers), { signal });
  container.addEventListener("input", (e) => handleInput(e, state, handlers), { signal });
  container.addEventListener("change", (e) => handleChange(e, state, handlers), { signal });
  _listenerCount += 3;
}
function bindGlobalEvents(state, handlers) {
  const signal = _abortController ? _abortController.signal : void 0;
  const boundKeyHandler = (e) => handleKeyboard(e, state, handlers);
  const boundContextHandler = (e) => handleContextMenu(e, state, handlers);
  const boundClickOutside = (e) => handleClickOutside(e, state, handlers);
  document.addEventListener("keydown", boundKeyHandler, { signal });
  document.addEventListener("contextmenu", boundContextHandler, { signal });
  document.addEventListener("click", boundClickOutside, { signal });
  _listenerCount += 3;
  return { boundKeyHandler, boundContextHandler, boundClickOutside };
}
function unbindGlobalEvents(boundHandlers) {
  document.removeEventListener("keydown", boundHandlers.boundKeyHandler);
  document.removeEventListener("contextmenu", boundHandlers.boundContextHandler);
  document.removeEventListener("click", boundHandlers.boundClickOutside);
}
function handleClick(e, state, handlers) {
  const target = e.target;
  const { container } = handlers;
  const onRender = handlers.onRender;
  const onFilterChange = handlers.onFilterChange;
  const onRefresh = handlers.onRefresh;
  const actionEl = target.closest("[data-action]");
  const action = actionEl ? actionEl.dataset.action : null;
  const idEl = target.closest("[data-id]");
  const id = actionEl ? actionEl.dataset.id || (idEl ? idEl.dataset.id : null) : idEl ? idEl.dataset.id : null;
  const groupHeader = target.closest(".p16-group-header");
  if (groupHeader) {
    const key = groupHeader.dataset.group;
    const collapsedGroups = state.collapsedGroups;
    collapsedGroups.has(key) ? collapsedGroups.delete(key) : collapsedGroups.add(key);
    onRender();
    return;
  }
  const filterStatusEl = target.closest("[data-filter-status]");
  const filterTipoEl = target.closest("[data-filter-tipo]");
  const filterUfEl = target.closest("[data-filter-uf]");
  const filterStatus = filterStatusEl ? filterStatusEl.dataset.filterStatus : void 0;
  const filterTipo = filterTipoEl ? filterTipoEl.dataset.filterTipo : void 0;
  const filterUf = filterUfEl ? filterUfEl.dataset.filterUf : void 0;
  const filters = state.filters;
  const data = state.data;
  const pagination = data.pagination;
  if (filterStatus !== void 0) {
    filters.status = filters.status === filterStatus ? "" : filterStatus;
    handlers.saveFilters();
    pagination.page = 1;
    handlers.resetInfiniteScroll();
    onFilterChange();
    return;
  }
  if (filterTipo !== void 0) {
    filters.tipo = filters.tipo === filterTipo ? "" : filterTipo;
    handlers.saveFilters();
    pagination.page = 1;
    handlers.resetInfiniteScroll();
    onFilterChange();
    return;
  }
  if (filterUf !== void 0) {
    filters.uf = filters.uf === filterUf ? "" : filterUf;
    handlers.saveFilters();
    pagination.page = 1;
    handlers.resetInfiniteScroll();
    onFilterChange();
    return;
  }
  const sortEl = target.closest("[data-sort]");
  const sortCol = sortEl ? sortEl.dataset.sort : null;
  if (sortCol) {
    handleSort(state.sortColumns, sortCol, e.shiftKey);
    handlers.saveSort();
    handlers.sortData();
    onRender();
    return;
  }
  const rowEl = target.closest(".p16-row[data-idx]");
  if (rowEl && !target.closest("button, input, a")) {
    state.focusedRowIndex = parseInt(rowEl.dataset.idx);
  }
  const selectedRows = state.selectedRows;
  const favorites = state.favorites;
  switch (action) {
    case "advanced-filters":
      state.showAdvancedFilters = true;
      onRender();
      break;
    case "close-modal":
      state.showAdvancedFilters = false;
      onRender();
      break;
    case "apply-advanced":
      handlers.applyAdvancedFilters();
      break;
    case "clear-advanced":
      handlers.clearAdvancedFilters();
      break;
    case "view":
    case "view-row":
    case "view-top":
      if (id) handlers.loadFornecedor360(id);
      break;
    case "close-detail":
      state.selectedFornecedor = null;
      onRender();
      break;
    case "toggle-favorite":
      if (id) handlers.toggleFavorite(id);
      break;
    case "toggle-expand":
      if (id) handlers.toggleExpand(id);
      break;
    case "clear-search":
      filters.search = "";
      handlers.saveFilters();
      handlers.resetInfiniteScroll();
      onFilterChange();
      break;
    case "clear-client-search":
      state.clientSearchTerm = "";
      onRender();
      break;
    case "clear-all-filters":
      state.filters = {};
      state.clientSearchTerm = "";
      handlers.saveFilters();
      pagination.page = 1;
      handlers.resetInfiniteScroll();
      onFilterChange();
      break;
    case "clear-sort":
      state.sortColumns = [{ column: "nome", direction: "asc" }];
      handlers.saveSort();
      handlers.sortData();
      onRender();
      break;
    case "remove-filter":
      handlers.removeFilter(actionEl.dataset.filterKey);
      break;
    case "select-row":
      if (id) {
        selectedRows.has(id) ? selectedRows.delete(id) : selectedRows.add(id);
        onRender();
      }
      break;
    case "bulk-clear":
      selectedRows.clear();
      onRender();
      break;
    case "bulk-export":
      handlers.exportSelected();
      break;
    case "bulk-favorite":
      selectedRows.forEach((rowId) => favorites.add(rowId));
      handlers.saveFavorites();
      selectedRows.clear();
      onRender();
      break;
    case "first-page":
      pagination.page = 1;
      onFilterChange();
      break;
    case "prev-page":
      if (pagination.page > 1) {
        pagination.page;
        pagination.page = pagination.page - 1;
        onFilterChange();
      }
      break;
    case "next-page":
      if (pagination.page < Math.ceil(pagination.total / pagination.limit)) {
        pagination.page = pagination.page + 1;
        onFilterChange();
      }
      break;
    case "last-page":
      pagination.page = Math.ceil(pagination.total / pagination.limit);
      onFilterChange();
      break;
    case "export":
      handlers.exportCSV();
      break;
    case "export-xlsx":
      handlers.exportXLSX();
      break;
    case "export-pdf":
      handlers.exportPDF();
      break;
    case "refresh":
      handlers.resetInfiniteScroll();
      onRefresh();
      break;
    case "quick-update":
      if (id) EventBusPort.emit(PANEL_16_UI_EVENTS.QUICK_UPDATE, { id, source: "panel-16:ui:events", timestamp: Date.now() });
      break;
    case "copy-doc":
      if (id) handlers.copyDoc(id);
      break;
  }
}
function handleInput(e, state, handlers) {
  const target = e.target;
  const filters = state.filters;
  const data = state.data;
  const pagination = data.pagination;
  if (target.id === "p16-search") {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      filters.search = target.value;
      handlers.saveFilters();
      pagination.page = 1;
      handlers.resetInfiniteScroll();
      handlers.onFilterChange();
    }, 350);
  }
  if (target.id === "p16-client-search") {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      state.clientSearchTerm = target.value;
      handlers.onRender();
    }, 150);
  }
  if (target.id === "p16-select-all") {
    const displayData = handlers.getDisplayData();
    if (target.checked) {
      displayData.forEach((f) => state.selectedRows.add(f.id));
    } else {
      state.selectedRows.clear();
    }
    handlers.onRender();
  }
}
function handleChange(e, state, handlers) {
  const target = e.target;
  const id = target.id;
  const filters = state.filters;
  const data = state.data;
  const pagination = data.pagination;
  if (id === "p16-filter-status") filters.status = target.value;
  else if (id === "p16-filter-tipo") filters.tipo = target.value;
  else if (id === "p16-filter-uf") filters.uf = target.value;
  else return;
  handlers.saveFilters();
  pagination.page = 1;
  handlers.resetInfiniteScroll();
  handlers.onFilterChange();
}
function handleKeyboard(e, state, handlers) {
  const ke = e;
  const onRender = handlers.onRender;
  const expandedRows = state.expandedRows;
  if (ke.key === "Escape") {
    if (state.showAdvancedFilters) {
      state.showAdvancedFilters = false;
      onRender();
      return;
    }
    if (state.contextMenu) {
      handlers.hideContextMenu();
      return;
    }
    if (state.selectedFornecedor) {
      state.selectedFornecedor = null;
      onRender();
      return;
    }
    if (expandedRows.size > 0) {
      expandedRows.clear();
      onRender();
      return;
    }
    state.focusedRowIndex = -1;
    onRender();
    return;
  }
  if (ke.key === "r" && !ke.ctrlKey && !ke.metaKey && document.activeElement?.tagName !== "INPUT") {
    e.preventDefault();
    handlers.onRefresh();
    return;
  }
  const displayData = handlers.getDisplayData();
  if (displayData.length === 0) return;
  const focusedIdx = state.focusedRowIndex;
  if (ke.key === "ArrowDown") {
    e.preventDefault();
    state.focusedRowIndex = Math.min(focusedIdx + 1, displayData.length - 1);
    onRender();
  }
  if (ke.key === "ArrowUp") {
    e.preventDefault();
    state.focusedRowIndex = Math.max(focusedIdx - 1, 0);
    onRender();
  }
  if (ke.key === "Enter" && focusedIdx >= 0 && document.activeElement?.tagName !== "INPUT") {
    e.preventDefault();
    handlers.loadFornecedor360(displayData[focusedIdx].id);
  }
  if (ke.key === " " && focusedIdx >= 0 && document.activeElement?.tagName !== "INPUT") {
    e.preventDefault();
    handlers.toggleExpand(displayData[focusedIdx].id);
  }
  if ((ke.key === "f" || ke.key === "F") && focusedIdx >= 0 && document.activeElement?.tagName !== "INPUT") {
    e.preventDefault();
    handlers.toggleFavorite(displayData[focusedIdx].id);
  }
}
function handleContextMenu(e, state, handlers) {
  const target = e.target;
  const me = e;
  const row = target.closest(".p16-row[data-id]");
  if (row && handlers.container.contains(row)) {
    e.preventDefault();
    handlers.showContextMenu(me.clientX, me.clientY, row.dataset.id);
  }
}
function handleClickOutside(e, state, handlers) {
  const target = e.target;
  if (state.contextMenu && !state.contextMenu.contains(target)) handlers.hideContextMenu();
  if (state.showColumnsDropdown && !target.closest(".p16-columns-toggle")) {
    state.showColumnsDropdown = false;
    handlers.renderControls();
  }
  if (state.showViewsDropdown && !target.closest(".p16-saved-views")) {
    state.showViewsDropdown = false;
    handlers.renderControls();
  }
}
function bindControlsEvents(controlsElement, state, handlers) {
  if (!controlsElement) return;
  const signal = _abortController ? _abortController.signal : void 0;
  controlsElement.addEventListener("click", (e) => handleControlsClick(e, state, handlers), { signal });
  controlsElement.addEventListener("change", (e) => handleControlsChange(e, state, handlers), { signal });
  _listenerCount += 2;
}
function unbindAllEvents() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
}
function handleControlsClick(e, state, handlers) {
  const target = e.target;
  const onRender = handlers.onRender;
  const renderControls = handlers.renderControls;
  const actionEl = target.closest("[data-action]");
  const action = actionEl ? actionEl.dataset.action : null;
  const periodEl = target.closest("[data-period]");
  if (periodEl) {
    state.period = parseInt(periodEl.dataset.period);
    handlers.onPeriodChange();
    renderControls();
    return;
  }
  const viewEl = target.closest("[data-view]");
  if (viewEl && !viewEl.dataset.viewId) {
    state.viewMode = viewEl.dataset.view;
    handlers.saveViewMode();
    onRender();
    return;
  }
  const viewItem = target.closest("[data-view-id]");
  if (viewItem && !target.closest("[data-delete-view]")) {
    handlers.applyView(viewItem.dataset.viewId);
    return;
  }
  const deleteView = target.closest("[data-delete-view]");
  if (deleteView) {
    handlers.deleteView(deleteView.dataset.deleteView);
    return;
  }
  const colCheckbox = target.closest("[data-column]");
  if (colCheckbox && colCheckbox.tagName === "INPUT") {
    const colId = colCheckbox.dataset.column;
    const col = state.columns.find((c) => c.id === colId);
    if (col) {
      col.visible = colCheckbox.checked;
      handlers.saveColumns();
      onRender();
    }
    return;
  }
  if (action === "pin-left" || action === "pin-right") {
    handlers.togglePin(actionEl.dataset.col, action === "pin-left" ? "left" : "right");
    return;
  }
  const data = state.data;
  const dataList = data.list;
  const pagination = data.pagination;
  switch (action) {
    case "toggle-columns":
      state.showColumnsDropdown = !state.showColumnsDropdown;
      state.showViewsDropdown = false;
      renderControls();
      break;
    case "toggle-views":
      state.showViewsDropdown = !state.showViewsDropdown;
      state.showColumnsDropdown = false;
      renderControls();
      break;
    case "reset-columns":
      handlers.resetColumns();
      break;
    case "save-view":
      handlers.saveCurrentView();
      break;
    case "toggle-pagination":
      state.useInfiniteScroll = false;
      handlers.resetInfiniteScroll();
      onRender();
      break;
    case "toggle-infinite":
      state.useInfiniteScroll = true;
      state.allLoadedData = dataList.slice();
      state.hasMoreData = dataList.length < pagination.total;
      onRender();
      break;
  }
}
function handleControlsChange(e, state, handlers) {
  const target = e.target;
  if (target.id === "p16-group-by") {
    state.groupBy = target.value;
    handlers.onRender();
  }
}
var events_default = { bindEvents, bindGlobalEvents, unbindGlobalEvents, unbindAllEvents, bindControlsEvents };
const MODULE_ID = "panels-panel-16-ui-events";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION, listenersBound: _listenerCount, hasAbortController: _abortController !== null };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, cleanupAvailable: true, listenersTracked: _abortController !== null || _listenerCount === 0 }, p24Instrumented: true, timestamp: Date.now() };
}
export {
  MODULE_ID,
  VERSION,
  bindControlsEvents,
  bindEvents,
  bindGlobalEvents,
  events_default as default,
  healthCheck,
  info,
  unbindAllEvents,
  unbindGlobalEvents
};
