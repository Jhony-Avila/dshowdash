

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ITERABLE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail-renderer
// PURPOSE: Panel Audit Trail - Renderer Enterprise AAA Ultimate+
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABS from ../core/contracts.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   mount() — exported function
//   unmount() — exported function
//   render() — exported function
//   toast() — exported function
//   setDensity() — exported function
//   setAutoRefreshState() — exported function
//   setSortingState() — exported function
//   updateHealthStats() — exported function
//   setFullscreen() — exported function
//   setColumnVisibility() — exported function
//   setInlineFiltersActive() — exported function
//   setInlineFilterValue() — exported function
//   clearInlineFilters() — exported function
//   ... and 12 more exports
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

import * as Template from './template.js';
import * as States from './states.js';
import * as Events from './events.js';
import { TABS } from '../core/contracts.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-audit-trail-renderer';

let _container: Element | null = null;
let _mounted = false;
let _lastState: Record<string, unknown> | null = null;
let _inlineFiltersActive = false;
let _inlineFilterValues: Record<string, string> = {};

export function mount(container: Element, handlers: Record<string, unknown> = {}) {
  if (_mounted) return { ok: false, error: 'Already mounted' };
  if (!container) return { ok: false, error: 'Container required' };

  _container = container;
  _container.innerHTML = Template.buildTemplate();

  const patContainer = _container.querySelector('[data-panel="audit-trail"]');

  States.init(patContainer);
  Events.init(patContainer, handlers);

  _mounted = true;
  return { ok: true };
}

export function unmount() {
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

export function render(state: Record<string, unknown>) {
  if (!_mounted || !_container) return;

  const patContainer = _container.querySelector('[data-panel="audit-trail"]');
  if (!patContainer) return;

  // Loading state com skeleton
  if (state.loading) {
    States.showLoading();
    States.hideError();
    _renderSkeleton(patContainer, state);
  } else {
    States.hideLoading();
    if (state.error) {
      States.showError(state.error as string);
    } else {
      States.hideError();
      _renderTable(patContainer, state);
    }
  }

  // Tab
  States.setActiveTab(state.activeTab as string);

  // Filters
  States.setFilters(state.filters as Record<string, string>);

  // Pagination
  const pagination = state.pagination as { offset: number; limit: number; total: number } | undefined;
  if (pagination) {
    States.updatePagination(pagination.offset, pagination.limit, pagination.total);
  }

  // Last update
  if (state.lastFetchAt) {
    States.setLastUpdate(state.lastFetchAt as string | number);
  }

  // Health stats
  if (state.healthStats) {
    States.setHealthSummary(state.healthStats as Record<string, number>);
  }

  // Auto-refresh
  if (state.autoRefresh) {
    const ar = state.autoRefresh as { enabled: boolean; countdown: number };
    States.setAutoRefresh(ar.enabled);
    States.setCountdown(ar.countdown);
  }

  // Density
  if (state.density) {
    States.setTableDensity(state.density as string);
  }

  // Sort
  if (state.sort) {
    const sort = state.sort as { key: string; direction: string };
    States.setSortColumn(sort.key, sort.direction);
  }

  // Group by
  if (state.groupBy !== undefined) {
    States.setGroupBy(state.groupBy as string);
  }

  // Inline filters state
  if (state.inlineFiltersActive !== undefined) {
    _inlineFiltersActive = state.inlineFiltersActive as boolean;
  }

  _lastState = state;
}

function _renderSkeleton(container: Element, state: Record<string, unknown>) {
  const thead = container.querySelector('[data-table-head]');
  const tbody = container.querySelector('[data-table-body]');

  if (!thead || !tbody) return;

  const tab = state.activeTab as string;
  const options = {
    showSelection: state.showSelection !== false,
    showExpand: state.showExpand !== false,
    visibleColumns: state.visibleColumns as string[] | undefined,
    showInlineFilters: _inlineFiltersActive,
    inlineFilterValues: _inlineFilterValues
  };

  thead.innerHTML = Template.buildTableHead(tab, options);

  const colspan = _getColspan(tab, options);
  tbody.innerHTML = Template.buildSkeletonRows(8, colspan);
}

function _renderTable(container: Element, state: Record<string, unknown>) {
  const thead = container.querySelector('[data-table-head]');
  const tbody = container.querySelector('[data-table-body]');

  if (!thead || !tbody) return;

  const logs = _getLogsByTab(state);
  const tab = state.activeTab as string;
  const options = {
    showSelection: state.showSelection !== false,
    showExpand: state.showExpand !== false,
    visibleColumns: state.visibleColumns as string[] | undefined,
    showInlineFilters: _inlineFiltersActive,
    inlineFilterValues: _inlineFilterValues
  };

  // Header com inline filters
  thead.innerHTML = Template.buildTableHead(tab, options);

  // Body
  if (!logs || logs.length === 0) {
    const colspan = _getColspan(tab, options);
    tbody.innerHTML = Template.buildEmptyRow(colspan);
    return;
  }

  // Render com ou sem grouping
  if (state.groupBy && state.groupBy !== '') {
    tbody.innerHTML = _renderGroupedRows(logs, tab, state, options);
  } else {
    tbody.innerHTML = _renderFlatRows(logs, tab, state, options);
  }

  // Aplicar classe de inline filters na tabela
  const table = container.querySelector('.pat-table');
  if (table) {
    table.classList.toggle('inline-filters-active', _inlineFiltersActive);
  }
}

function _renderFlatRows(logs: Record<string, unknown>[], tab: string, state: Record<string, unknown>, options: Record<string, unknown>) {
  // v8.2.0: Guard contra valores não-iteráveis
  if (!Array.isArray(logs)) return '';

  const selectedIds = (state.selectedIds || new Set()) as Set<string>;
  const expandedIds = (state.expandedIds || new Set()) as Set<string>;
  const colspan = _getColspan(tab, options);

  let html = '';

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

function _renderGroupedRows(logs: Record<string, unknown>[], tab: string, state: Record<string, unknown>, options: Record<string, unknown>) {
  // v8.2.0: Guard contra valores não-iteráveis
  if (!Array.isArray(logs)) return '';

  const selectedIds = (state.selectedIds || new Set()) as Set<string>;
  const expandedIds = (state.expandedIds || new Set()) as Set<string>;
  const collapsedGroups = (state.collapsedGroups || new Set()) as Set<string>;
  const groupBy = state.groupBy as string;
  const colspan = _getColspan(tab, options);

  const groups: Record<string, Record<string, unknown>[]> = {};
  for (const log of logs) {
    const groupValue = String(log[groupBy] || 'Sem valor');
    if (!groups[groupValue]) groups[groupValue] = [];
    groups[groupValue].push(log);
  }

  let html = '';
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

function _buildRowByTab(tab: string, log: Record<string, unknown>, options: Record<string, unknown>) {
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

function _getLogsByTab(state: Record<string, unknown>) {
  // v8.2.0: Ensure return value is always a proper array
  let raw;
  switch (state.activeTab) {
    case TABS.AUDIT: raw = state.auditLogs; break;
    case TABS.PERMISSIONS: raw = state.permissionLogs; break;
    case TABS.FRONTEND: raw = state.frontendLogs; break;
    case TABS.SECURITY: raw = state.securityLogs; break;
    default: raw = state.auditLogs;
  }
  return Array.isArray(raw) ? raw : [];
}

function _getColspan(tab: string, options: Record<string, unknown>) {
  let base = Template.COLUMNS[tab]?.length || 6;
  if (options.showExpand) base += 1;
  if (options.showSelection) base += 1;
  return base;
}

// === PUBLIC API ===

export function toast(message: string, type = 'info') {
  States.toast(message, type);
}

export function setDensity(density: string) {
  States.setTableDensity(density);
}

export function setAutoRefreshState(enabled: boolean, countdown: number) {
  States.setAutoRefresh(enabled);
  States.setCountdown(countdown);
}

export function setSortingState(key: string, direction: string) {
  States.setSortColumn(key, direction);
}

export function updateHealthStats(stats: Record<string, number>) {
  States.setHealthSummary(stats);
}

export function setFullscreen(active: boolean) {
  return States.setFullscreen(active);
}

export function setColumnVisibility(colKey: string, visible: boolean) {
  States.setColumnVisibility(colKey, visible);
}

export function setInlineFiltersActive(active: boolean) {
  _inlineFiltersActive = active;
  States.setInlineFiltersActive(active);

  // Re-render se tiver estado
  if (_lastState) {
    const patContainer = _container?.querySelector('[data-panel="audit-trail"]');
    if (patContainer) {
      _renderTable(patContainer, _lastState);
    }
  }
}

export function setInlineFilterValue(colKey: string, value: string) {
  _inlineFilterValues[colKey] = value;
}

export function clearInlineFilters() {
  _inlineFilterValues = {};
}

export function updateColumnsMenu(tab: string, visibleColumns: string[]) {
  States.updateColumnsMenu(tab, visibleColumns);
}

// Selection
export function setAllRowsSelected(selected: boolean) {
  States.setAllRowsSelected(selected);
}

export function setRowSelected(logId: string, selected: boolean) {
  States.setRowSelected(logId, selected);
}

export function setSelectedCount(count: number) {
  States.setSelectedCount(count);
}

export function updateSelectAllState(allSelected: boolean, someSelected: boolean) {
  States.updateSelectAllState(allSelected, someSelected);
}

// Expansion
export function toggleRowExpanded(logId: string, expanded: boolean) {
  States.toggleRowExpanded(logId, expanded);
}

export function collapseAllRows() {
  States.collapseAllRows();
}

// Grouping
export function setGroupBy(groupKey: string) {
  States.setGroupBy(groupKey);
}

export function toggleGroupCollapsed(groupId: string, collapsed: boolean) {
  States.toggleGroupCollapsed(groupId, collapsed);
}

// Export
export function showExportProgress(show: boolean, progress?: number, text?: string) {
  States.showExportProgress(show, progress, text);
}

export function getVersion() { return VERSION; }

export function healthCheck() {
  return {
    status: _mounted ? 'healthy' : 'not_mounted',
    mounted: _mounted,
    hasContainer: !!_container,
    inlineFiltersActive: _inlineFiltersActive,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export default {
  VERSION, MODULE_ID,
  mount, unmount, render,
  toast, setDensity, setAutoRefreshState, setSortingState,
  updateHealthStats, setFullscreen, setColumnVisibility,
  setInlineFiltersActive, setInlineFilterValue, clearInlineFilters, updateColumnsMenu,
  setAllRowsSelected, setRowSelected, setSelectedCount, updateSelectAllState,
  toggleRowExpanded, collapseAllRows,
  setGroupBy, toggleGroupCollapsed,
  showExportProgress,
  getVersion, healthCheck
};
