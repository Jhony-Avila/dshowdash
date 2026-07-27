const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/api-extended";
function mixinExtendedAPI(TableComponent) {
  const proto = TableComponent.prototype;
  proto.getColumnsManager = function() {
    return this._columnsManager;
  };
  proto.getKeyboard = function() {
    return this._keyboard;
  };
  proto.getBulkEdit = function() {
    return this._bulkEdit;
  };
  proto.getTags = function() {
    return this._tags;
  };
  proto.getSavedViews = function() {
    return this._savedViews;
  };
  proto.getBadgeNew = function() {
    return this._badgeNew;
  };
  proto.getRowHoverMenu = function() {
    return this._rowHoverMenu;
  };
  proto.getSummaryRow = function() {
    return this._summaryRow;
  };
  proto.getHighlightingRules = function() {
    return this._highlightingRules;
  };
  proto.getAnomalyDetector = function() {
    return this._anomalyDetector;
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
        columns: this.columns,
        // @ts-expect-error strict migration — TS2571
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
    if (this._anomalyDetector) {
      return this._anomalyDetector.analyze(this._currentItems);
    }
    return [];
  };
  proto.markAsNew = function(ids) {
    if (this._badgeNew) this._badgeNew.markNew(ids);
  };
  proto.clearNewBadges = function() {
    if (this._badgeNew) this._badgeNew.clearAll();
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var api_extended_default = { mixinExtendedAPI };
export {
  MODULE_ID,
  VERSION,
  api_extended_default as default,
  info,
  mixinExtendedAPI
};
