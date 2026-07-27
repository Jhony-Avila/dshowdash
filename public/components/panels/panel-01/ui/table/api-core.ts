// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/api-core
// PURPOSE: Panel-01 Table - Core API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   mixinCoreAPI() — exported function
//   info() — exported function
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
export const MODULE_ID = 'panel-01/ui/table/api-core';

// Mixin para adicionar API core à TableComponent
export function mixinCoreAPI(TableComponent: { prototype: Record<string, unknown> }) {
  const proto = TableComponent.prototype;

  // === Core Feature Getters ===
  proto.getDragDrop = function() { return this._dragDrop; };
  proto.getResize = function() { return this._resize; };
  proto.getMultiSort = function() { return this._multiSort; };
  proto.getSticky = function() { return this._sticky; };
  proto.getInlineEditor = function() { return this._inlineEditor; };
  proto.getGrouping = function() { return this._grouping; };
  proto.getSorting = function() { return this._sorting; };
  proto.getEventManager = function() { return this._eventManager; };
  proto.getTableElement = function() { return this._tableEl; };
  proto.getTbodyElement = function() { return this._tbodyEl; };

  // === Feature Control ===
  proto.enableFeature = function(name: string) {
    // @ts-expect-error strict migration — TS2571
    this._features[name] = true;
    // @ts-expect-error strict migration — TS2571
    this._initFeatures();
  };

  proto.disableFeature = function(name: string) {
    // @ts-expect-error strict migration — TS2571
    this._features[name] = false;
    // @ts-expect-error strict migration — TS2339
    if (name === 'dragDrop' && this._dragDrop) this._dragDrop.disable();
    // @ts-expect-error strict migration — TS2339
    if (name === 'sticky' && this._sticky) this._sticky.remove();
    // @ts-expect-error strict migration — TS2339
    if (name === 'eventManager' && this._eventManager) this._eventManager.disable();
    // @ts-expect-error strict migration — TS2339
    if (name === 'keyboard' && this._keyboard) this._keyboard.destroy();
    // @ts-expect-error strict migration — TS2339
    if (name === 'rowHoverMenu' && this._rowHoverMenu) this._rowHoverMenu.destroy();
  };

  // === Grouping API ===
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

  // === Sorting API ===
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
    if (this._multiSort && this._multiSort.hasSorts()) {
      // @ts-expect-error strict migration — TS2339
      return this._multiSort.sortArray(items);
    }
    // @ts-expect-error strict migration — TS2571
    return this._sorting.sortArray(items);
  };

  // === Inline Edit API ===
  proto.cancelEdit = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._inlineEditor) this._inlineEditor.cancel();
  };

  proto.isEditing = function() {
    // @ts-expect-error strict migration — TS2339
    return this._inlineEditor ? this._inlineEditor.isEditing() : false;
  };

  // === Column Management ===
  proto.setColumnWidth = function(colId: string, width: number) {
    // @ts-expect-error strict migration — TS2339
    if (this._resize) this._resize.setWidth(colId, width);
  };

  proto.getColumnWidths = function() {
    // @ts-expect-error strict migration — TS2339
    return this._resize ? this._resize.getWidths() : {};
  };

  proto.refreshSticky = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._sticky) this._sticky.refresh();
  };

  // === Loading State ===
  proto.setLoading = function(loading: boolean) {
    // @ts-expect-error strict migration — TS2339
    if (this._tableEl) this._tableEl.classList.toggle('p01-table--loading', loading);
  };

  // === Event Management ===
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

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { mixinCoreAPI };
