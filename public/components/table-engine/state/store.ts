// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:state
// PURPOSE: Table Engine - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULTS from ../constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TableState — exported class
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { DEFAULTS } from '../constants.js';

export const VERSION = '2.0.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:state';

export class TableState {
  [key: string]: any;
  constructor(options: { pageSize?: number; density?: string } = {}) {
    this._originalData = [];
    this._state = {
      data: [],
      filteredData: [],
      columns: [],
      visibleColumns: [],
      hiddenColumns: new Set(),
      pinnedColumns: { left: [], right: [] },
      selection: new Set(),
      expanded: new Set(),
      sort: { column: null, direction: 'asc' },
      search: '',
      filters: {},
      pagination: { page: 1, pageSize: options.pageSize || DEFAULTS.pageSize, total: 0 },
      density: options.density || DEFAULTS.density,
      loading: false,
      error: null
    };
    this._listeners = new Set();
    this._initialized = false;
  }

  // Getters imutáveis
  get(key?: string) { return key ? this._state[key] : { ...this._state }; }
  getData() { return [...this._state.data]; }
  getOriginalData() { return [...this._originalData]; }
  getFilteredData() { return [...this._state.filteredData]; }
  getColumns() { return [...this._state.columns]; }
  getVisibleColumns() { return [...this._state.visibleColumns]; }
  getSelection() { return new Set(this._state.selection); }
  getExpanded() { return new Set(this._state.expanded); }
  getSort() { return { ...this._state.sort }; }
  getPagination() { return { ...this._state.pagination }; }

  getSelectedRows() {
    const selection = this._state.selection;
    return this._state.data.filter((row: Record<string, unknown>) => selection.has(String(row.id)));
  }

  getRowById(id: string | number) {
    return this._state.data.find((row: Record<string, unknown>) => String(row.id) === String(id)) || null;
  }

  // Setters com notificação
  set(key: string, value: unknown) {
    const prev = this._state[key];
    this._state[key] = value;
    this._notify(key, value, prev);
    return this;
  }

  setData(data: Record<string, unknown>[]) {
    const arr = Array.isArray(data) ? data : [];
    this._originalData = [...arr];
    this._state.data = [...arr];
    this._state.filteredData = [...arr];
    this._state.pagination.total = arr.length;
    this._state.pagination.page = 1;
    this._state.selection.clear();
    this._state.expanded.clear();
    this._notify('data', this._state.data);
    return this;
  }

  setFilteredData(data: Record<string, unknown>[]) {
    this._state.filteredData = Array.isArray(data) ? data : [];
    this._state.pagination.total = this._state.filteredData.length;
    this._state.pagination.page = 1;
    this._notify('filteredData', this._state.filteredData);
    return this;
  }

  setColumns(columns: Record<string, unknown>[]) {
    this._state.columns = Array.isArray(columns) ? columns : [];
    this._state.visibleColumns = this._state.columns.filter((c: Record<string, unknown>) => !this._state.hiddenColumns.has(c.id as string));
    this._notify('columns', this._state.columns);
    return this;
  }

  // Row operations
  addRow(row: Record<string, unknown>, position: string = 'end') {
    if (!row) return this;
    if (position === 'start') {
      this._state.data.unshift(row);
      this._originalData.unshift(row);
      this._state.filteredData.unshift(row);
    } else {
      this._state.data.push(row);
      this._originalData.push(row);
      this._state.filteredData.push(row);
    }
    this._state.pagination.total = this._state.filteredData.length;
    this._notify('data', this._state.data);
    return this;
  }

  updateRow(rowId: string | number, changes: Record<string, unknown>) {
    const id = String(rowId);
    const updateFn = (arr: Record<string, unknown>[]) => {
      const idx = arr.findIndex((r: Record<string, unknown>) => String(r.id) === id);
      if (idx !== -1) arr[idx] = { ...arr[idx], ...changes };
    };
    updateFn(this._state.data);
    updateFn(this._state.filteredData);
    this._notify('data', this._state.data);
    return this;
  }

  deleteRows(ids: (string | number)[]) {
    const idsSet = new Set(ids.map(String));
    const filterFn = (arr: Record<string, unknown>[]) => arr.filter((r: Record<string, unknown>) => !idsSet.has(String(r.id)));
    this._state.data = filterFn(this._state.data);
    this._originalData = filterFn(this._originalData);
    this._state.filteredData = filterFn(this._state.filteredData);
    idsSet.forEach(id => {
      this._state.selection.delete(id);
      this._state.expanded.delete(id);
    });
    this._state.pagination.total = this._state.filteredData.length;
    this._notify('data', this._state.data);
    return this;
  }

  // Selection
  select(id: string | number) { this._state.selection.add(String(id)); this._notify('selection', this._state.selection); return this; }
  deselect(id: string | number) { this._state.selection.delete(String(id)); this._notify('selection', this._state.selection); return this; }
  selectAll() { this._state.filteredData.forEach((row: Record<string, unknown>) => this._state.selection.add(String(row.id))); this._notify('selection', this._state.selection); return this; }
  clearSelection() { this._state.selection.clear(); this._notify('selection', this._state.selection); return this; }
  toggleSelection(id: string | number) { const sid = String(id); this._state.selection.has(sid) ? this.deselect(sid) : this.select(sid); return this; }
  isSelected(id: string | number) { return this._state.selection.has(String(id)); }

  // Expansion
  expand(id: string | number) { this._state.expanded.add(String(id)); this._notify('expanded', this._state.expanded); return this; }
  collapse(id: string | number) { this._state.expanded.delete(String(id)); this._notify('expanded', this._state.expanded); return this; }
  toggleExpand(id: string | number) { const sid = String(id); this._state.expanded.has(sid) ? this.collapse(sid) : this.expand(sid); return this; }
  collapseAll() { this._state.expanded.clear(); this._notify('expanded', this._state.expanded); return this; }
  isExpanded(id: string | number) { return this._state.expanded.has(String(id)); }

  // Sort
  setSort(column: string | null, direction: string = 'asc') { this._state.sort = { column, direction }; this._notify('sort', this._state.sort); return this; }
  toggleSort(column: string) {
    if (this._state.sort.column === column) {
      this._state.sort.direction = this._state.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this._state.sort = { column, direction: 'asc' };
    }
    this._notify('sort', this._state.sort);
    return this;
  }

  // Pagination
  setPage(page: number) {
    const maxPage = Math.ceil(this._state.pagination.total / this._state.pagination.pageSize) || 1;
    this._state.pagination.page = Math.max(1, Math.min(page, maxPage));
    this._notify('pagination', this._state.pagination);
    return this;
  }

  setPageSize(size: number) {
    this._state.pagination.pageSize = size;
    this._state.pagination.page = 1;
    this._notify('pagination', this._state.pagination);
    return this;
  }

  getPagedData() {
    const { page, pageSize } = this._state.pagination;
    const start = (page - 1) * pageSize;
    return this._state.filteredData.slice(start, start + pageSize);
  }

  // Search
  setSearch(term: string) { this._state.search = term || ''; this._notify('search', this._state.search); return this; }
  getSearch() { return this._state.search; }

  // Column visibility
  hideColumn(id: string) { this._state.hiddenColumns.add(id); this._updateVisibleColumns(); return this; }
  showColumn(id: string) { this._state.hiddenColumns.delete(id); this._updateVisibleColumns(); return this; }
  toggleColumn(id: string) { this._state.hiddenColumns.has(id) ? this.showColumn(id) : this.hideColumn(id); return this; }
  _updateVisibleColumns() {
    this._state.visibleColumns = this._state.columns.filter((c: Record<string, unknown>) => !this._state.hiddenColumns.has(c.id as string));
    this._notify('visibleColumns', this._state.visibleColumns);
  }

  // Loading/Error
  setLoading(loading: boolean) { this._state.loading = Boolean(loading); this._notify('loading', this._state.loading); return this; }
  isLoading() { return this._state.loading; }
  setError(error: string | null) { this._state.error = error; this._notify('error', this._state.error); return this; }
  getError() { return this._state.error; }
  clearError() { this._state.error = null; this._notify('error', null); return this; }

  // Observers
  subscribe(callback: (key: string, value: unknown, prev?: unknown) => void) {
    if (typeof callback === 'function') this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify(key: string, value: unknown, prev?: unknown) {
    this._listeners.forEach((cb: (key: string, value: unknown, prev?: unknown) => void) => { try { cb(key, value, prev); } catch (e) { /* silent */ } });
  }

  // Reset
  reset() {
    this._originalData = [];
    this._state.data = [];
    this._state.filteredData = [];
    this._state.selection.clear();
    this._state.expanded.clear();
    this._state.sort = { column: null, direction: 'asc' };
    this._state.search = '';
    this._state.filters = {};
    this._state.pagination = { page: 1, pageSize: this._state.pagination.pageSize, total: 0 };
    this._state.error = null;
    this._state.loading = false;
    this._notify('reset', this._state);
    return this;
  }

  // Diagnóstico
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      dataCount: this._state.data.length,
      filteredCount: this._state.filteredData.length,
      columnsCount: this._state.columns.length,
      selectionCount: this._state.selection.size,
      expandedCount: this._state.expanded.size,
      page: this._state.pagination.page,
      pageSize: this._state.pagination.pageSize
    };
  }

  healthCheck() {
    const checks = {
      hasColumns: this._state.columns.length > 0,
      noError: !this._state.error,
      notLoading: !this._state.loading
    };
    const passed = Object.values(checks).filter(Boolean).length;
    return {
      status: passed === 3 ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY',
      score: `${passed}/3`,
      checks,
      moduleId: MODULE_ID,
      version: VERSION
    };
  }
}

export default TableState;
