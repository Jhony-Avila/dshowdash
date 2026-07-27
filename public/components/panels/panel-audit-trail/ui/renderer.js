import * as Template from "./template.js";
import * as States from "./states.js";
import * as Events from "./events.js";
import { TABS } from "../core/contracts.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail-renderer";
let _container = null;
let _mounted = false;
let _lastState = null;
let _inlineFiltersActive = false;
let _inlineFilterValues = {};
function mount(container, handlers = {}) {
  if (_mounted) return { ok: false, error: "Already mounted" };
  if (!container) return { ok: false, error: "Container required" };
  _container = container;
  _container.innerHTML = Template.buildTemplate();
  const patContainer = _container.querySelector('[data-panel="audit-trail"]');
  States.init(patContainer);
  Events.init(patContainer, handlers);
  _mounted = true;
  return { ok: true };
}
function unmount() {
  if (!_mounted) return { ok: false };
  Events.destroy();
  States.destroy();
  _container = null;
  _mounted = false;
  _lastState = null;
  _inlineFiltersActive = false;
  _inlineFilterValues = {};
  return { ok: true };
}
function render(state) {
  if (!_mounted || !_container) return;
  const patContainer = _container.querySelector('[data-panel="audit-trail"]');
  if (!patContainer) return;
  if (state.loading) {
    States.showLoading();
    States.hideError();
    _renderSkeleton(patContainer, state);
  } else {
    States.hideLoading();
    if (state.error) {
      States.showError(state.error);
    } else {
      States.hideError();
      _renderTable(patContainer, state);
    }
  }
  States.setActiveTab(state.activeTab);
  States.setFilters(state.filters);
  const pagination = state.pagination;
  if (pagination) {
    States.updatePagination(pagination.offset, pagination.limit, pagination.total);
  }
  if (state.lastFetchAt) {
    States.setLastUpdate(state.lastFetchAt);
  }
  if (state.healthStats) {
    States.setHealthSummary(state.healthStats);
  }
  if (state.autoRefresh) {
    const ar = state.autoRefresh;
    States.setAutoRefresh(ar.enabled);
    States.setCountdown(ar.countdown);
  }
  if (state.density) {
    States.setTableDensity(state.density);
  }
  if (state.sort) {
    const sort = state.sort;
    States.setSortColumn(sort.key, sort.direction);
  }
  if (state.groupBy !== void 0) {
    States.setGroupBy(state.groupBy);
  }
  if (state.inlineFiltersActive !== void 0) {
    _inlineFiltersActive = state.inlineFiltersActive;
  }
  _lastState = state;
}
function _renderSkeleton(container, state) {
  const thead = container.querySelector("[data-table-head]");
  const tbody = container.querySelector("[data-table-body]");
  if (!thead || !tbody) return;
  const tab = state.activeTab;
  const options = {
    showSelection: state.showSelection !== false,
    showExpand: state.showExpand !== false,
    visibleColumns: state.visibleColumns,
    showInlineFilters: _inlineFiltersActive,
    inlineFilterValues: _inlineFilterValues
  };
  thead.innerHTML = Template.buildTableHead(tab, options);
  const colspan = _getColspan(tab, options);
  tbody.innerHTML = Template.buildSkeletonRows(8, colspan);
}
function _renderTable(container, state) {
  const thead = container.querySelector("[data-table-head]");
  const tbody = container.querySelector("[data-table-body]");
  if (!thead || !tbody) return;
  const logs = _getLogsByTab(state);
  const tab = state.activeTab;
  const options = {
    showSelection: state.showSelection !== false,
    showExpand: state.showExpand !== false,
    visibleColumns: state.visibleColumns,
    showInlineFilters: _inlineFiltersActive,
    inlineFilterValues: _inlineFilterValues
  };
  thead.innerHTML = Template.buildTableHead(tab, options);
  if (!logs || logs.length === 0) {
    const colspan = _getColspan(tab, options);
    tbody.innerHTML = Template.buildEmptyRow(colspan);
    return;
  }
  if (state.groupBy && state.groupBy !== "") {
    tbody.innerHTML = _renderGroupedRows(logs, tab, state, options);
  } else {
    tbody.innerHTML = _renderFlatRows(logs, tab, state, options);
  }
  const table = container.querySelector(".pat-table");
  if (table) {
    table.classList.toggle("inline-filters-active", _inlineFiltersActive);
  }
}
function _renderFlatRows(logs, tab, state, options) {
  if (!Array.isArray(logs)) return "";
  const selectedIds = state.selectedIds || /* @__PURE__ */ new Set();
  const expandedIds = state.expandedIds || /* @__PURE__ */ new Set();
  const colspan = _getColspan(tab, options);
  let html = "";
  for (const log of logs) {
    const logId = String(log.id);
    const isSelected = selectedIds.has(logId);
    const isExpanded = expandedIds.has(logId);
    const rowOptions = {
      ...options,
      selected: isSelected,
      expanded: isExpanded
    };
    html += _buildRowByTab(tab, log, rowOptions);
    if (isExpanded) {
      html += Template.buildExpandedRow(log, colspan);
    }
  }
  return html;
}
function _renderGroupedRows(logs, tab, state, options) {
  if (!Array.isArray(logs)) return "";
  const selectedIds = state.selectedIds || /* @__PURE__ */ new Set();
  const expandedIds = state.expandedIds || /* @__PURE__ */ new Set();
  const collapsedGroups = state.collapsedGroups || /* @__PURE__ */ new Set();
  const groupBy = state.groupBy;
  const colspan = _getColspan(tab, options);
  const groups = {};
  for (const log of logs) {
    const groupValue = String(log[groupBy] || "Sem valor");
    if (!groups[groupValue]) groups[groupValue] = [];
    groups[groupValue].push(log);
  }
  let html = "";
  const sortedGroups = Object.keys(groups).sort();
  for (const groupValue of sortedGroups) {
    const groupLogs = groups[groupValue];
    const groupId = `${groupBy}:${groupValue}`;
    const isCollapsed = collapsedGroups.has(groupId);
    html += Template.buildGroupHeader(groupBy, groupValue, groupLogs.length, colspan);
    if (!isCollapsed) {
      for (const log of groupLogs) {
        const logId = String(log.id);
        const isSelected = selectedIds.has(logId);
        const isExpanded = expandedIds.has(logId);
        const rowOptions = {
          ...options,
          selected: isSelected,
          expanded: isExpanded
        };
        html += _buildRowByTab(tab, log, rowOptions);
        if (isExpanded) {
          html += Template.buildExpandedRow(log, colspan);
        }
      }
    }
  }
  return html;
}
function _buildRowByTab(tab, log, options) {
  switch (tab) {
    case TABS.AUDIT:
      return Template.buildAuditRow(log, options);
    case TABS.PERMISSIONS:
      return Template.buildPermissionRow(log, options);
    case TABS.FRONTEND:
      return Template.buildFrontendRow(log, options);
    case TABS.SECURITY:
      return Template.buildSecurityRow(log, options);
    default:
      return Template.buildAuditRow(log, options);
  }
}
function _getLogsByTab(state) {
  let raw;
  switch (state.activeTab) {
    case TABS.AUDIT:
      raw = state.auditLogs;
      break;
    case TABS.PERMISSIONS:
      raw = state.permissionLogs;
      break;
    case TABS.FRONTEND:
      raw = state.frontendLogs;
      break;
    case TABS.SECURITY:
      raw = state.securityLogs;
      break;
    default:
      raw = state.auditLogs;
  }
  return Array.isArray(raw) ? raw : [];
}
function _getColspan(tab, options) {
  let base = Template.COLUMNS[tab]?.length || 6;
  if (options.showExpand) base += 1;
  if (options.showSelection) base += 1;
  return base;
}
function toast(message, type = "info") {
  States.toast(message, type);
}
function setDensity(density) {
  States.setTableDensity(density);
}
function setAutoRefreshState(enabled, countdown) {
  States.setAutoRefresh(enabled);
  States.setCountdown(countdown);
}
function setSortingState(key, direction) {
  States.setSortColumn(key, direction);
}
function updateHealthStats(stats) {
  States.setHealthSummary(stats);
}
function setFullscreen(active) {
  return States.setFullscreen(active);
}
function setColumnVisibility(colKey, visible) {
  States.setColumnVisibility(colKey, visible);
}
function setInlineFiltersActive(active) {
  _inlineFiltersActive = active;
  States.setInlineFiltersActive(active);
  if (_lastState) {
    const patContainer = _container?.querySelector('[data-panel="audit-trail"]');
    if (patContainer) {
      _renderTable(patContainer, _lastState);
    }
  }
}
function setInlineFilterValue(colKey, value) {
  _inlineFilterValues[colKey] = value;
}
function clearInlineFilters() {
  _inlineFilterValues = {};
}
function updateColumnsMenu(tab, visibleColumns) {
  States.updateColumnsMenu(tab, visibleColumns);
}
function setAllRowsSelected(selected) {
  States.setAllRowsSelected(selected);
}
function setRowSelected(logId, selected) {
  States.setRowSelected(logId, selected);
}
function setSelectedCount(count) {
  States.setSelectedCount(count);
}
function updateSelectAllState(allSelected, someSelected) {
  States.updateSelectAllState(allSelected, someSelected);
}
function toggleRowExpanded(logId, expanded) {
  States.toggleRowExpanded(logId, expanded);
}
function collapseAllRows() {
  States.collapseAllRows();
}
function setGroupBy(groupKey) {
  States.setGroupBy(groupKey);
}
function toggleGroupCollapsed(groupId, collapsed) {
  States.toggleGroupCollapsed(groupId, collapsed);
}
function showExportProgress(show, progress, text) {
  States.showExportProgress(show, progress, text);
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  return {
    status: _mounted ? "healthy" : "not_mounted",
    mounted: _mounted,
    hasContainer: !!_container,
    inlineFiltersActive: _inlineFiltersActive,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
var renderer_default = {
  VERSION,
  MODULE_ID,
  mount,
  unmount,
  render,
  toast,
  setDensity,
  setAutoRefreshState,
  setSortingState,
  updateHealthStats,
  setFullscreen,
  setColumnVisibility,
  setInlineFiltersActive,
  setInlineFilterValue,
  clearInlineFilters,
  updateColumnsMenu,
  setAllRowsSelected,
  setRowSelected,
  setSelectedCount,
  updateSelectAllState,
  toggleRowExpanded,
  collapseAllRows,
  setGroupBy,
  toggleGroupCollapsed,
  showExportProgress,
  getVersion,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  clearInlineFilters,
  collapseAllRows,
  renderer_default as default,
  getVersion,
  healthCheck,
  mount,
  render,
  setAllRowsSelected,
  setAutoRefreshState,
  setColumnVisibility,
  setDensity,
  setFullscreen,
  setGroupBy,
  setInlineFilterValue,
  setInlineFiltersActive,
  setRowSelected,
  setSelectedCount,
  setSortingState,
  showExportProgress,
  toast,
  toggleGroupCollapsed,
  toggleRowExpanded,
  unmount,
  updateColumnsMenu,
  updateHealthStats,
  updateSelectAllState
};
