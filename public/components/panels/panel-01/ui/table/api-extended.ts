// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/api-extended
// PURPOSE: Panel-01 Table - Extended API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   mixinExtendedAPI() — exported function
//   info() — exported function
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
export const MODULE_ID = 'panel-01/ui/table/api-extended';

// Mixin para adicionar API estendida à TableComponent
export function mixinExtendedAPI(TableComponent: { prototype: Record<string, unknown> }) {
  const proto = TableComponent.prototype;

  // === Extended Feature Getters ===
  proto.getColumnsManager = function() { return this._columnsManager; };
  proto.getKeyboard = function() { return this._keyboard; };
  proto.getBulkEdit = function() { return this._bulkEdit; };
  proto.getTags = function() { return this._tags; };
  proto.getSavedViews = function() { return this._savedViews; };
  proto.getBadgeNew = function() { return this._badgeNew; };
  proto.getRowHoverMenu = function() { return this._rowHoverMenu; };
  proto.getSummaryRow = function() { return this._summaryRow; };
  proto.getHighlightingRules = function() { return this._highlightingRules; };
  proto.getAnomalyDetector = function() { return this._anomalyDetector; };

  // === Columns Manager API ===
  proto.showColumnsDropdown = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._columnsManager) this._columnsManager.showDropdown();
  };

  proto.hideColumnsDropdown = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._columnsManager) this._columnsManager.hideDropdown();
  };

  proto.toggleColumn = function(colId: string, visible: boolean) {
    // @ts-expect-error strict migration — TS2339
    if (this._columnsManager) this._columnsManager.toggleColumn(colId, visible);
  };

  // === Bulk Edit API ===
  proto.startBulkEdit = function(ids: unknown[], field: string) {
    // @ts-expect-error strict migration — TS2339
    if (this._bulkEdit) this._bulkEdit.start(ids, field);
  };

  proto.cancelBulkEdit = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._bulkEdit) this._bulkEdit.cancel();
  };

  // === Tags API ===
  proto.addTag = function(id: string | number, tag: string) {
    // @ts-expect-error strict migration — TS2339
    if (this._tags) this._tags.addTag(id, tag);
  };

  proto.removeTag = function(id: string | number, tag: string) {
    // @ts-expect-error strict migration — TS2339
    if (this._tags) this._tags.removeTag(id, tag);
  };

  proto.getTags = function(id: string | number) {
    // @ts-expect-error strict migration — TS2339
    return this._tags ? this._tags.getTags(id) : [];
  };

  // === Saved Views API ===
  proto.saveCurrentView = function(name: string) {
    if (this._savedViews) {
      // @ts-expect-error strict migration — TS2339
      return this._savedViews.save(name, {
        columns: this.columns,
        // @ts-expect-error strict migration — TS2571
        sort: this.getSorts(),
        // @ts-expect-error strict migration — TS2339
        groupBy: this._grouping ? this._grouping.get() : null
      });
    }
  };

  proto.loadView = function(name: string) {
    // @ts-expect-error strict migration — TS2339
    if (this._savedViews) return this._savedViews.load(name);
  };

  proto.getViews = function() {
    // @ts-expect-error strict migration — TS2339
    return this._savedViews ? this._savedViews.getAll() : [];
  };

  // === Highlighting Rules API ===
  proto.addHighlightRule = function(rule: unknown) {
    if (this._highlightingRules) {
      // @ts-expect-error strict migration — TS2339
      this._highlightingRules.addRule(rule);
      // @ts-expect-error strict migration — TS2571
      this._applyHighlightRules();
    }
  };

  proto.removeHighlightRule = function(ruleId: string | number) {
    if (this._highlightingRules) {
      // @ts-expect-error strict migration — TS2339
      this._highlightingRules.removeRule(ruleId);
      // @ts-expect-error strict migration — TS2571
      this._applyHighlightRules();
    }
  };

  proto.clearHighlightRules = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._highlightingRules) this._highlightingRules.clear();
  };

  // === Summary Row API ===
  proto.showSummaryRow = function() {
    if (this._summaryRow) {
      // @ts-expect-error strict migration — TS2339
      this._summaryRow.show();
      // @ts-expect-error strict migration — TS2339
      this._summaryRow.render(this._tbodyEl, this._currentItems);
    }
  };

  proto.hideSummaryRow = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._summaryRow) this._summaryRow.hide();
  };

  // === Anomaly Detection API ===
  proto.detectAnomalies = function() {
    if (this._anomalyDetector) {
      // @ts-expect-error strict migration — TS2339
      return this._anomalyDetector.analyze(this._currentItems);
    }
    return [];
  };

  // === Badge New API ===
  proto.markAsNew = function(ids: unknown[]) {
    // @ts-expect-error strict migration — TS2339
    if (this._badgeNew) this._badgeNew.markNew(ids);
  };

  proto.clearNewBadges = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._badgeNew) this._badgeNew.clearAll();
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { mixinExtendedAPI };
