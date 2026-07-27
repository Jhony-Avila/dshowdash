const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/multi-sort";
class MultiSortManager {
  constructor(options = {}) {
    this.sorts = [];
    this.maxSorts = options.maxSorts || 3;
    this.onSort = options.onSort || (() => {
    });
  }
  addSort(field, order = "ASC", isShiftKey = false) {
    if (isShiftKey && this.sorts.length < this.maxSorts) {
      const existing = this.sorts.findIndex((s) => s.field === field);
      if (existing >= 0) {
        this.sorts[existing].order = this.sorts[existing].order === "ASC" ? "DESC" : "ASC";
      } else {
        this.sorts.push({ field, order });
      }
    } else {
      const existing = this.sorts.find((s) => s.field === field);
      if (existing && this.sorts.length === 1) {
        existing.order = existing.order === "ASC" ? "DESC" : "ASC";
      } else {
        this.sorts = [{ field, order }];
      }
    }
    this.onSort(this.sorts);
  }
  removeSort(field) {
    this.sorts = this.sorts.filter((s) => s.field !== field);
    this.onSort(this.sorts);
  }
  clear() {
    this.sorts = [];
    this.onSort(this.sorts);
  }
  getSorts() {
    return [...this.sorts];
  }
  hasSorts() {
    return this.sorts.length > 0;
  }
  getSortIndex(field) {
    const idx = this.sorts.findIndex((s) => s.field === field);
    return idx >= 0 ? idx + 1 : null;
  }
  getSortOrder(field) {
    const sort = this.sorts.find((s) => s.field === field);
    return sort ? sort.order : null;
  }
  compare(a, b) {
    for (const sort of this.sorts) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      let result = 0;
      if (aVal === null || aVal === void 0) result = 1;
      else if (bVal === null || bVal === void 0) result = -1;
      else if (typeof aVal === "string") result = aVal.localeCompare(bVal, "pt-BR", { numeric: true });
      else result = aVal - bVal;
      if (result !== 0) return sort.order === "DESC" ? -result : result;
    }
    return 0;
  }
  sortArray(array) {
    return [...array].sort((a, b) => this.compare(a, b));
  }
  toQueryParams() {
    if (this.sorts.length === 0) return {};
    if (this.sorts.length === 1) return { sort: this.sorts[0].field, order: this.sorts[0].order };
    return { sorts: this.sorts.map((s) => `${s.field}:${s.order}`).join(",") };
  }
}
function createMultiSortManager(options = {}) {
  return new MultiSortManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var multi_sort_default = { MultiSortManager, createMultiSortManager };
export {
  MODULE_ID,
  MultiSortManager,
  VERSION,
  createMultiSortManager,
  multi_sort_default as default,
  healthCheck,
  info
};
