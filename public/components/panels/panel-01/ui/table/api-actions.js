const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/api-actions";
function applyActionsMixin(TableComponent) {
  const proto = TableComponent.prototype;
  proto.enableFeature = function(name) {
    this._features[name] = true;
    this._initFeatures();
  };
  proto.disableFeature = function(name) {
    this._features[name] = false;
    if (name === "dragDrop" && this._dragDrop) this._dragDrop.disable();
    if (name === "sticky" && this._sticky) this._sticky.remove();
    if (name === "eventManager" && this._eventManager) this._eventManager.disable();
    if (name === "keyboard" && this._keyboard) this._keyboard.destroy();
    if (name === "rowHoverMenu" && this._rowHoverMenu) this._rowHoverMenu.destroy();
  };
  proto.showColumnsDropdown = function() {
    if (this._columnsManager) this._columnsManager.showDropdown();
  };
  proto.hideColumnsDropdown = function() {
    if (this._columnsManager) this._columnsManager.hideDropdown();
  };
  proto.toggleColumn = function(colId, visible) {
    if (this._columnsManager) this._columnsManager.toggleColumn(colId, visible);
  };
  proto.startBulkEdit = function(ids, field) {
    if (this._bulkEdit) this._bulkEdit.start(ids, field);
  };
  proto.cancelBulkEdit = function() {
    if (this._bulkEdit) this._bulkEdit.cancel();
  };
  proto.addTag = function(id, tag) {
    if (this._tags) this._tags.addTag(id, tag);
  };
  proto.removeTag = function(id, tag) {
    if (this._tags) this._tags.removeTag(id, tag);
  };
  proto.getTags = function(id) {
    return this._tags ? this._tags.getTags(id) : [];
  };
  proto.saveCurrentView = function(name) {
    if (this._savedViews) {
      return this._savedViews.save(name, {
        // @ts-expect-error strict migration — TS2571
        columns: this.columns,
        sort: this.getSorts(),
        // @ts-expect-error strict migration — TS2339
        groupBy: this._grouping ? this._grouping.get() : null
      });
    }
  };
  proto.loadView = function(name) {
    if (this._savedViews) return this._savedViews.load(name);
  };
  proto.getViews = function() {
    return this._savedViews ? this._savedViews.getAll() : [];
  };
  proto.addHighlightRule = function(rule) {
    if (this._highlightingRules) {
      this._highlightingRules.addRule(rule);
      this._applyHighlightRules();
    }
  };
  proto.removeHighlightRule = function(ruleId) {
    if (this._highlightingRules) {
      this._highlightingRules.removeRule(ruleId);
      this._applyHighlightRules();
    }
  };
  proto.clearHighlightRules = function() {
    if (this._highlightingRules) this._highlightingRules.clear();
  };
  proto.showSummaryRow = function() {
    if (this._summaryRow) {
      this._summaryRow.show();
      this._summaryRow.render(this._tbodyEl, this._currentItems);
    }
  };
  proto.hideSummaryRow = function() {
    if (this._summaryRow) this._summaryRow.hide();
  };
  proto.detectAnomalies = function() {
    if (this._anomalyDetector) return this._anomalyDetector.analyze(this._currentItems);
    return [];
  };
  proto.markAsNew = function(ids) {
    if (this._badgeNew) this._badgeNew.markNew(ids);
  };
  proto.clearNewBadges = function() {
    if (this._badgeNew) this._badgeNew.clearAll();
  };
}
export {
  MODULE_ID,
  VERSION,
  applyActionsMixin
};
