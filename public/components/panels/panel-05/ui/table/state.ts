
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:state
// PURPOSE: Panel-05 Table State Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_COLUMN_ORDER from ./constants.js
//
// PROVIDES:
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
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

declare const Logger: Record<string, Function>;
import { DEFAULT_COLUMN_ORDER } from './constants.js';

// ═══════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════
const STORAGE_KEYS = {
  columnWidths: 'p05_col_widths',
  hiddenColumns: 'p05_hidden_cols',
  pinnedColumns: 'p05_pinned',
  density: 'p05_density',
  columnOrder: 'p05_col_order',
  scrollMode: 'p05_scroll_mode'
};

// ═══════════════════════════════════════════════════════════════
// SAFE STORAGE ACCESS
// ═══════════════════════════════════════════════════════════════
function safeGet(key: string, defaultValue: unknown) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    Logger?.warn?.('[panel-05:table:state] Storage error:', e);
  }
}

function safeGetString(key: string, defaultValue: string) {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSetString(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    Logger?.warn?.('[panel-05:table:state] Storage error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STATE CLASS
// ═══════════════════════════════════════════════════════════════
export class TableState {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    // Core data
    this.data = [];
    this.filteredData = [];
    this.favoritos = options.favoritos || [];

    // Column state
    this.columnWidths = safeGet(STORAGE_KEYS.columnWidths, {});
    this.hiddenColumns = safeGet(STORAGE_KEYS.hiddenColumns, []);
    this.pinnedColumns = safeGet(STORAGE_KEYS.pinnedColumns, {});
    this.columnOrder = this._loadColumnOrder();

    // Display state
    this.density = safeGetString(STORAGE_KEYS.density, 'comfortable');
    this.scrollMode = options.scrollMode || safeGetString(STORAGE_KEYS.scrollMode, 'pagination');

    // Selection state
    this.selectedRowId = null;
    this.selectedIds = new Set();
    this.expandedRows = new Set();

    // Sort state
    this.sortColumns = [];

    // Search state
    this.searchQuery = '';

    // Pagination state
    this.page = 1;
    this.perPage = options.perPage || 25;

    // Virtual scroll state
    this.virtualStart = 0;
    this.virtualEnd = 0;
    this.scrollTop = 0;
    this.viewportHeight = 0;

    // Infinite scroll state
    this.infiniteLoading = false;
    this.infiniteHasMore = true;
    this.infiniteLoadedCount = 0;
    this.infiniteChunkSize = options.infiniteChunkSize || 50;

    // UI state
    this.columnMenuOpen = false;
    this.contextMenuOpen = false;
    this.contextMenuTarget = null;
    this.keyboardHelpOpen = false;

    // Shell pattern state
    this.shellRendered = false;
    this.refs = {};
    this.lastDataHash = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // COLUMN ORDER
  // ═══════════════════════════════════════════════════════════════
  _loadColumnOrder() {
    const saved = safeGet(STORAGE_KEYS.columnOrder, null);
    return saved && saved.length ? saved : [...DEFAULT_COLUMN_ORDER];
  }

  saveColumnOrder() {
    safeSet(STORAGE_KEYS.columnOrder, this.columnOrder);
  }

  resetColumnOrder() {
    this.columnOrder = [...DEFAULT_COLUMN_ORDER];
    this.saveColumnOrder();
  }

  // ═══════════════════════════════════════════════════════════════
  // COLUMN WIDTHS
  // ═══════════════════════════════════════════════════════════════
  setColumnWidth(colId: string, width: number) {
    this.columnWidths[colId] = width;
    safeSet(STORAGE_KEYS.columnWidths, this.columnWidths);
  }

  // ═══════════════════════════════════════════════════════════════
  // HIDDEN COLUMNS
  // ═══════════════════════════════════════════════════════════════
  toggleColumnVisibility(colId: string) {
    const idx = this.hiddenColumns.indexOf(colId);
    if (idx > -1) {
      this.hiddenColumns.splice(idx, 1);
    } else {
      this.hiddenColumns.push(colId);
    }
    safeSet(STORAGE_KEYS.hiddenColumns, this.hiddenColumns);
  }

  isColumnHidden(colId: string) {
    return this.hiddenColumns.includes(colId);
  }

  // ═══════════════════════════════════════════════════════════════
  // PINNED COLUMNS
  // ═══════════════════════════════════════════════════════════════
  pinColumn(colId: string, side: string) {
    this.pinnedColumns[colId] = side;
    safeSet(STORAGE_KEYS.pinnedColumns, this.pinnedColumns);
  }

  unpinColumn(colId: string) {
    delete this.pinnedColumns[colId];
    safeSet(STORAGE_KEYS.pinnedColumns, this.pinnedColumns);
  }

  getColumnPin(colId: string) {
    return this.pinnedColumns[colId] || null;
  }

  // ═══════════════════════════════════════════════════════════════
  // DENSITY
  // ═══════════════════════════════════════════════════════════════
  setDensity(mode: string) {
    this.density = mode;
    safeSetString(STORAGE_KEYS.density, mode);
  }

  // ═══════════════════════════════════════════════════════════════
  // SCROLL MODE
  // ═══════════════════════════════════════════════════════════════
  setScrollMode(mode: string) {
    this.scrollMode = mode;
    safeSetString(STORAGE_KEYS.scrollMode, mode);
    if (mode === 'infinite') {
      this.infiniteLoadedCount = this.data.length;
      this.infiniteHasMore = true;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════════════════════════
  setData(data: Array<Record<string, unknown>>) {
    this.data = data || [];
    this.filteredData = [...this.data];
    this.page = 1;
    if (this.scrollMode === 'infinite') {
      this.infiniteLoadedCount = this.data.length;
    }
  }

  getDisplayData() {
    return this.searchQuery ? this.filteredData : this.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // SELECTION
  // ═══════════════════════════════════════════════════════════════
  selectRow(id: string | null) {
    this.selectedRowId = id;
    this.selectedIds.clear();
    if (id) {
      this.selectedIds.add(id);
    }
  }

  toggleSelection(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.selectedRowId = id;
  }

  selectRange(ids: string[]) {
    ids.forEach((id: string) => this.selectedIds.add(id));
  }

  selectAll() {
    this.getDisplayData().forEach((c: Record<string, unknown>) => this.selectedIds.add(String(c.id)));
  }

  clearSelection() {
    this.selectedIds.clear();
    this.selectedRowId = null;
  }

  isSelected(id: string) {
    return this.selectedIds.has(id);
  }

  getSelectedIds() {
    return [...this.selectedIds];
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPANSION
  // ═══════════════════════════════════════════════════════════════
  toggleExpansion(id: string) {
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
      return false;
    } else {
      this.expandedRows.add(id);
      return true;
    }
  }

  isExpanded(id: string) {
    return this.expandedRows.has(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // FAVORITOS
  // ═══════════════════════════════════════════════════════════════
  setFavoritos(favs: string[]) {
    this.favoritos = favs || [];
  }

  isFavorito(id: string) {
    return this.favoritos.includes(String(id));
  }

  // ═══════════════════════════════════════════════════════════════
  // SORT
  // ═══════════════════════════════════════════════════════════════
  handleSort(field: string, addToExisting = false) {
    if (addToExisting && this.sortColumns.length < 3) {
      const idx = this.sortColumns.findIndex((s: Record<string, unknown>) => s.field === field);
      if (idx > -1) {
        this.sortColumns[idx].dir = this.sortColumns[idx].dir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumns.push({ field, dir: 'asc' });
      }
    } else {
      const existing = this.sortColumns.find((s: Record<string, unknown>) => s.field === field);
      this.sortColumns = [{ field, dir: existing?.dir === 'asc' ? 'desc' : 'asc' }];
    }
    return this.sortColumns;
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGINATION
  // ═══════════════════════════════════════════════════════════════
  setPage(page: number) {
    this.page = page;
  }

  getTotalPages() {
    return Math.ceil(this.getDisplayData().length / this.perPage);
  }

  getPageData() {
    const displayData = this.getDisplayData();
    const start = (this.page - 1) * this.perPage;
    return displayData.slice(start, start + this.perPage);
  }

  // ═══════════════════════════════════════════════════════════════
  // INFO
  // ═══════════════════════════════════════════════════════════════
  getInfo() {
    return {
      dataCount: this.data.length,
      filteredCount: this.filteredData.length,
      searchQuery: this.searchQuery,
      hiddenColumns: this.hiddenColumns,
      pinnedColumns: this.pinnedColumns,
      columnOrder: this.columnOrder,
      expandedRows: [...this.expandedRows],
      density: this.density,
      scrollMode: this.scrollMode,
      selectedIds: [...this.selectedIds],
      sortColumns: this.sortColumns,
      page: this.page,
      perPage: this.perPage,
      virtualRange: { start: this.virtualStart, end: this.virtualEnd },
      infiniteState: {
        loading: this.infiniteLoading,
        hasMore: this.infiniteHasMore,
        loaded: this.infiniteLoadedCount
      },
      shellRendered: this.shellRendered
    };
  }
}

export default TableState;

export const MODULE_ID = 'panel-05:table:state';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { stateReady: true } }; }
