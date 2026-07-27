const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/api-table-ops";
function applyTableOpsMixin(TableComponent) {
  const proto = TableComponent.prototype;
  proto.setGroupBy = function(field) {
    if (this._grouping) {
      this._grouping.setGroupBy(field);
      this.render({ items: this._currentItems, selectedIds: /* @__PURE__ */ new Set(), sort: this._sorting.get() });
    }
  };
  proto.clearGrouping = function() {
    if (this._grouping) {
      this._grouping.clearGrouping();
      this.render({ items: this._currentItems, selectedIds: /* @__PURE__ */ new Set(), sort: this._sorting.get() });
    }
  };
  proto.expandAllGroups = function() {
    if (this._grouping) {
      const groups = this._grouping.groupItems(this._currentItems);
      this._grouping.expandAll(groups.map((g) => g.key));
      this.render({ items: this._currentItems, selectedIds: /* @__PURE__ */ new Set(), sort: this._sorting.get() });
    }
  };
  proto.collapseAllGroups = function() {
    if (this._grouping) {
      this._grouping.collapseAll();
      this.render({ items: this._currentItems, selectedIds: /* @__PURE__ */ new Set(), sort: this._sorting.get() });
    }
  };
  proto.getSorts = function() {
    return this._multiSort ? this._multiSort.getSorts() : [this._sorting.get()];
  };
  proto.clearSorts = function() {
    if (this._multiSort) this._multiSort.clear();
    this._sorting.reset();
  };
  proto.sortLocally = function(items) {
    if (this._multiSort && this._multiSort.hasSorts()) return this._multiSort.sortArray(items);
    return this._sorting.sortArray(items);
  };
  proto.cancelEdit = function() {
    if (this._inlineEditor) this._inlineEditor.cancel();
  };
  proto.isEditing = function() {
    return this._inlineEditor ? this._inlineEditor.isEditing() : false;
  };
  proto.setColumnWidth = function(colId, width) {
    if (this._resize) this._resize.setWidth(colId, width);
  };
  proto.getColumnWidths = function() {
    return this._resize ? this._resize.getWidths() : {};
  };
  proto.refreshSticky = function() {
    if (this._sticky) this._sticky.refresh();
  };
  proto.setLoading = function(loading) {
    if (this._tableEl) this._tableEl.classList.toggle("p01-table--loading", loading);
  };
  proto.on = function(event, handler) {
    if (this._eventManager) this._eventManager.on(event, handler);
    return this;
  };
  proto.off = function(event) {
    if (this._eventManager) this._eventManager.off(event);
    return this;
  };
}
export {
  MODULE_ID,
  VERSION,
  applyTableOpsMixin
};
