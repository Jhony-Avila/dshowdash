import { DEFAULTS } from "../constants.js";
const VERSION = "2.0.0-ENTERPRISE";
const MODULE_ID = "table-engine:state";
class TableState {
  constructor(options = {}) {
    this._originalData = [];
    this._state = {
      data: [],
      filteredData: [],
      columns: [],
      visibleColumns: [],
      hiddenColumns: /* @__PURE__ */ new Set(),
      pinnedColumns: { left: [], right: [] },
      selection: /* @__PURE__ */ new Set(),
      expanded: /* @__PURE__ */ new Set(),
      sort: { column: null, direction: "asc" },
      search: "",
      filters: {},
      pagination: { page: 1, pageSize: options.pageSize || DEFAULTS.pageSize, total: 0 },
      density: options.density || DEFAULTS.density,
      loading: false,
      error: null
    };
    this._listeners = /* @__PURE__ */ new Set();
    this._initialized = false;
  }
  // Getters imutáveis
  get(key) {
    return key ? this._state[key] : { ...this._state };
  }
  getData() {
    return [...this._state.data];
  }
  getOriginalData() {
    return [...this._originalData];
  }
  getFilteredData() {
    return [...this._state.filteredData];
  }
  getColumns() {
    return [...this._state.columns];
  }
  getVisibleColumns() {
    return [...this._state.visibleColumns];
  }
  getSelection() {
    return new Set(this._state.selection);
  }
  getExpanded() {
    return new Set(this._state.expanded);
  }
  getSort() {
    return { ...this._state.sort };
  }
  getPagination() {
    return { ...this._state.pagination };
  }
  getSelectedRows() {
    const selection = this._state.selection;
    return this._state.data.filter((row) => selection.has(String(row.id)));
  }
  getRowById(id) {
    return this._state.data.find((row) => String(row.id) === String(id)) || null;
  }
  // Setters com notificação
  set(key, value) {
    const prev = this._state[key];
    this._state[key] = value;
    this._notify(key, value, prev);
    return this;
  }
  setData(data) {
    const arr = Array.isArray(data) ? data : [];
    this._originalData = [...arr];
    this._state.data = [...arr];
    this._state.filteredData = [...arr];
    this._state.pagination.total = arr.length;
    this._state.pagination.page = 1;
    this._state.selection.clear();
    this._state.expanded.clear();
    this._notify("data", this._state.data);
    return this;
  }
  setFilteredData(data) {
    this._state.filteredData = Array.isArray(data) ? data : [];
    this._state.pagination.total = this._state.filteredData.length;
    this._state.pagination.page = 1;
    this._notify("filteredData", this._state.filteredData);
    return this;
  }
  setColumns(columns) {
    this._state.columns = Array.isArray(columns) ? columns : [];
    this._state.visibleColumns = this._state.columns.filter((c) => !this._state.hiddenColumns.has(c.id));
    this._notify("columns", this._state.columns);
    return this;
  }
  // Row operations
  addRow(row, position = "end") {
    if (!row) return this;
    if (position === "start") {
      this._state.data.unshift(row);
      this._originalData.unshift(row);
      this._state.filteredData.unshift(row);
    } else {
      this._state.data.push(row);
      this._originalData.push(row);
      this._state.filteredData.push(row);
    }
    this._state.pagination.total = this._state.filteredData.length;
    this._notify("data", this._state.data);
    return this;
  }
  updateRow(rowId, changes) {
    const id = String(rowId);
    const updateFn = (arr) => {
      const idx = arr.findIndex((r) => String(r.id) === id);
      if (idx !== -1) arr[idx] = { ...arr[idx], ...changes };
    };
    updateFn(this._state.data);
    updateFn(this._state.filteredData);
    this._notify("data", this._state.data);
    return this;
  }
  deleteRows(ids) {
    const idsSet = new Set(ids.map(String));
    const filterFn = (arr) => arr.filter((r) => !idsSet.has(String(r.id)));
    this._state.data = filterFn(this._state.data);
    this._originalData = filterFn(this._originalData);
    this._state.filteredData = filterFn(this._state.filteredData);
    idsSet.forEach((id) => {
      this._state.selection.delete(id);
      this._state.expanded.delete(id);
    });
    this._state.pagination.total = this._state.filteredData.length;
    this._notify("data", this._state.data);
    return this;
  }
  // Selection
  select(id) {
    this._state.selection.add(String(id));
    this._notify("selection", this._state.selection);
    return this;
  }
  deselect(id) {
    this._state.selection.delete(String(id));
    this._notify("selection", this._state.selection);
    return this;
  }
  selectAll() {
    this._state.filteredData.forEach((row) => this._state.selection.add(String(row.id)));
    this._notify("selection", this._state.selection);
    return this;
  }
  clearSelection() {
    this._state.selection.clear();
    this._notify("selection", this._state.selection);
    return this;
  }
  toggleSelection(id) {
    const sid = String(id);
    this._state.selection.has(sid) ? this.deselect(sid) : this.select(sid);
    return this;
  }
  isSelected(id) {
    return this._state.selection.has(String(id));
  }
  // Expansion
  expand(id) {
    this._state.expanded.add(String(id));
    this._notify("expanded", this._state.expanded);
    return this;
  }
  collapse(id) {
    this._state.expanded.delete(String(id));
    this._notify("expanded", this._state.expanded);
    return this;
  }
  toggleExpand(id) {
    const sid = String(id);
    this._state.expanded.has(sid) ? this.collapse(sid) : this.expand(sid);
    return this;
  }
  collapseAll() {
    this._state.expanded.clear();
    this._notify("expanded", this._state.expanded);
    return this;
  }
  isExpanded(id) {
    return this._state.expanded.has(String(id));
  }
  // Sort
  setSort(column, direction = "asc") {
    this._state.sort = { column, direction };
    this._notify("sort", this._state.sort);
    return this;
  }
  toggleSort(column) {
    if (this._state.sort.column === column) {
      this._state.sort.direction = this._state.sort.direction === "asc" ? "desc" : "asc";
    } else {
      this._state.sort = { column, direction: "asc" };
    }
    this._notify("sort", this._state.sort);
    return this;
  }
  // Pagination
  setPage(page) {
    const maxPage = Math.ceil(this._state.pagination.total / this._state.pagination.pageSize) || 1;
    this._state.pagination.page = Math.max(1, Math.min(page, maxPage));
    this._notify("pagination", this._state.pagination);
    return this;
  }
  setPageSize(size) {
    this._state.pagination.pageSize = size;
    this._state.pagination.page = 1;
    this._notify("pagination", this._state.pagination);
    return this;
  }
  getPagedData() {
    const { page, pageSize } = this._state.pagination;
    const start = (page - 1) * pageSize;
    return this._state.filteredData.slice(start, start + pageSize);
  }
  // Search
  setSearch(term) {
    this._state.search = term || "";
    this._notify("search", this._state.search);
    return this;
  }
  getSearch() {
    return this._state.search;
  }
  // Column visibility
  hideColumn(id) {
    this._state.hiddenColumns.add(id);
    this._updateVisibleColumns();
    return this;
  }
  showColumn(id) {
    this._state.hiddenColumns.delete(id);
    this._updateVisibleColumns();
    return this;
  }
  toggleColumn(id) {
    this._state.hiddenColumns.has(id) ? this.showColumn(id) : this.hideColumn(id);
    return this;
  }
  _updateVisibleColumns() {
    this._state.visibleColumns = this._state.columns.filter((c) => !this._state.hiddenColumns.has(c.id));
    this._notify("visibleColumns", this._state.visibleColumns);
  }
  // Loading/Error
  setLoading(loading) {
    this._state.loading = Boolean(loading);
    this._notify("loading", this._state.loading);
    return this;
  }
  isLoading() {
    return this._state.loading;
  }
  setError(error) {
    this._state.error = error;
    this._notify("error", this._state.error);
    return this;
  }
  getError() {
    return this._state.error;
  }
  clearError() {
    this._state.error = null;
    this._notify("error", null);
    return this;
  }
  // Observers
  subscribe(callback) {
    if (typeof callback === "function") this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }
  _notify(key, value, prev) {
    this._listeners.forEach((cb) => {
      try {
        cb(key, value, prev);
      } catch (e) {
      }
    });
  }
  // Reset
  reset() {
    this._originalData = [];
    this._state.data = [];
    this._state.filteredData = [];
    this._state.selection.clear();
    this._state.expanded.clear();
    this._state.sort = { column: null, direction: "asc" };
    this._state.search = "";
    this._state.filters = {};
    this._state.pagination = { page: 1, pageSize: this._state.pagination.pageSize, total: 0 };
    this._state.error = null;
    this._state.loading = false;
    this._notify("reset", this._state);
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
      status: passed === 3 ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY",
      score: `${passed}/3`,
      checks,
      moduleId: MODULE_ID,
      version: VERSION
    };
  }
}
var store_default = TableState;
export {
  MODULE_ID,
  TableState,
  VERSION,
  store_default as default
};
