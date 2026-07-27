// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/api-table-ops
// PURPOSE: Panel-01 Table - API Table Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   applyTableOpsMixin() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/api-table-ops';

// Mixin para operações de tabela
export function applyTableOpsMixin(TableComponent: { prototype: Record<string, unknown> }) {
  const proto = TableComponent.prototype;

  // Grouping
  proto.setGroupBy = function(field: string) {
    if (this._grouping) {
      // @ts-expect-error strict migration — TS2339
      this._grouping.setGroupBy(field);
      // @ts-expect-error strict migration — TS2571
      this.render({ items: this._currentItems, selectedIds: new Set(), sort: this._sorting.get() });
    }
  };

  proto.clearGrouping = function() {
    if (this._grouping) {
      // @ts-expect-error strict migration — TS2339
      this._grouping.clearGrouping();
      // @ts-expect-error strict migration — TS2571
      this.render({ items: this._currentItems, selectedIds: new Set(), sort: this._sorting.get() });
    }
  };

  proto.expandAllGroups = function() {
    if (this._grouping) {
      // @ts-expect-error strict migration — TS2339
      const groups = this._grouping.groupItems(this._currentItems);
      // @ts-expect-error strict migration — TS2339
      this._grouping.expandAll(groups.map((g: Record<string, unknown>) => g.key));
      // @ts-expect-error strict migration — TS2571
      this.render({ items: this._currentItems, selectedIds: new Set(), sort: this._sorting.get() });
    }
  };

  proto.collapseAllGroups = function() {
    if (this._grouping) {
      // @ts-expect-error strict migration — TS2339
      this._grouping.collapseAll();
      // @ts-expect-error strict migration — TS2571
      this.render({ items: this._currentItems, selectedIds: new Set(), sort: this._sorting.get() });
    }
  };

  // Sorting
  proto.getSorts = function() {
    // @ts-expect-error strict migration — TS2339, TS2571
    return this._multiSort ? this._multiSort.getSorts() : [this._sorting.get()];
  };

  proto.clearSorts = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._multiSort) this._multiSort.clear();
    // @ts-expect-error strict migration — TS2571
    this._sorting.reset();
  };

  proto.sortLocally = function(items: unknown[]) {
    // @ts-expect-error strict migration — TS2339
    if (this._multiSort && this._multiSort.hasSorts()) return this._multiSort.sortArray(items);
    // @ts-expect-error strict migration — TS2571
    return this._sorting.sortArray(items);
  };

  // Inline Edit
  // @ts-expect-error strict migration — TS2339
  proto.cancelEdit = function() { if (this._inlineEditor) this._inlineEditor.cancel(); };
  // @ts-expect-error strict migration — TS2339
  proto.isEditing = function() { return this._inlineEditor ? this._inlineEditor.isEditing() : false; };

  // Column Management
  // @ts-expect-error strict migration — TS2339
  proto.setColumnWidth = function(colId: string, width: number) { if (this._resize) this._resize.setWidth(colId, width); };
  // @ts-expect-error strict migration — TS2339
  proto.getColumnWidths = function() { return this._resize ? this._resize.getWidths() : {}; };
  // @ts-expect-error strict migration — TS2339
  proto.refreshSticky = function() { if (this._sticky) this._sticky.refresh(); };

  // Loading State
  proto.setLoading = function(loading: boolean) {
    // @ts-expect-error strict migration — TS2339
    if (this._tableEl) this._tableEl.classList.toggle('p01-table--loading', loading);
  };

  // Event Management
  proto.on = function(event: string, handler: (...args: unknown[]) => void) {
    // @ts-expect-error strict migration — TS2339
    if (this._eventManager) this._eventManager.on(event, handler);
    return this;
  };

  proto.off = function(event: string) {
    // @ts-expect-error strict migration — TS2339
    if (this._eventManager) this._eventManager.off(event);
    return this;
  };
}
