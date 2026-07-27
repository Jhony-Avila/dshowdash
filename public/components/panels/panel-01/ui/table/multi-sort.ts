// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/multi-sort
// PURPOSE: Panel-01 - Multi-Sort
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createMultiSortManager() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/multi-sort';

export class MultiSortManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.sorts = [];
    this.maxSorts = options.maxSorts || 3;
    this.onSort = options.onSort || (() => {});
  }

  addSort(field: string, order = 'ASC', isShiftKey = false) {
    if (isShiftKey && this.sorts.length < this.maxSorts) {
      const existing = this.sorts.findIndex((s: Record<string, unknown>) => s.field === field);
      if (existing >= 0) {
        this.sorts[existing].order = this.sorts[existing].order === 'ASC' ? 'DESC' : 'ASC';
      } else {
        this.sorts.push({ field, order });
      }
    } else {
      const existing = this.sorts.find((s: Record<string, unknown>) => s.field === field);
      if (existing && this.sorts.length === 1) {
        existing.order = existing.order === 'ASC' ? 'DESC' : 'ASC';
      } else {
        this.sorts = [{ field, order }];
      }
    }
    this.onSort(this.sorts);
  }

  removeSort(field: string) {
    this.sorts = this.sorts.filter((s: Record<string, unknown>) => s.field !== field);
    this.onSort(this.sorts);
  }

  clear() { this.sorts = []; this.onSort(this.sorts); }
  getSorts() { return [...this.sorts]; }
  hasSorts() { return this.sorts.length > 0; }

  getSortIndex(field: string) {
    const idx = this.sorts.findIndex((s: Record<string, unknown>) => s.field === field);
    return idx >= 0 ? idx + 1 : null;
  }

  getSortOrder(field: string) {
    const sort = this.sorts.find((s: Record<string, unknown>) => s.field === field);
    return sort ? sort.order : null;
  }

  compare(a: Record<string, unknown>, b: Record<string, unknown>) {
    for (const sort of this.sorts as Array<{ field: string; order: string }>) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      let result = 0;
      if (aVal === null || aVal === undefined) result = 1;
      else if (bVal === null || bVal === undefined) result = -1;
      else if (typeof aVal === 'string') result = aVal.localeCompare(bVal as string, 'pt-BR', { numeric: true });
      else result = (aVal as number) - (bVal as number);
      if (result !== 0) return sort.order === 'DESC' ? -result : result;
    }
    return 0;
  }

  sortArray(array: Record<string, unknown>[]) { return [...array].sort((a, b) => this.compare(a, b)); }

  toQueryParams() {
    if (this.sorts.length === 0) return {};
    if (this.sorts.length === 1) return { sort: this.sorts[0].field, order: this.sorts[0].order };
    return { sorts: (this.sorts as Array<{ field: string; order: string }>).map((s: { field: string; order: string }) => `${s.field}:${s.order}`).join(',') };
  }
}

export function createMultiSortManager(options: Record<string, unknown> = {}) { return new MultiSortManager(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { MultiSortManager, createMultiSortManager };
