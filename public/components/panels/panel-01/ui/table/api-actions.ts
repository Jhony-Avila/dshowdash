// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/api-actions
// PURPOSE: Panel-01 Table - API Actions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   applyActionsMixin() — exported function
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
export const MODULE_ID = 'panel-01/ui/table/api-actions';

// Mixin para adicionar métodos de ação à classe TableComponent
export function applyActionsMixin(TableComponent: { prototype: Record<string, unknown> }) {
  const proto = TableComponent.prototype;

  // Feature Control
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

  // Columns Manager
  // @ts-expect-error strict migration — TS2339
  proto.showColumnsDropdown = function() { if (this._columnsManager) this._columnsManager.showDropdown(); };
  // @ts-expect-error strict migration — TS2339
  proto.hideColumnsDropdown = function() { if (this._columnsManager) this._columnsManager.hideDropdown(); };
  // @ts-expect-error strict migration — TS2339
  proto.toggleColumn = function(colId: string, visible: boolean) { if (this._columnsManager) this._columnsManager.toggleColumn(colId, visible); };

  // Bulk Edit
  // @ts-expect-error strict migration — TS2339
  proto.startBulkEdit = function(ids: unknown[], field: string) { if (this._bulkEdit) this._bulkEdit.start(ids, field); };
  // @ts-expect-error strict migration — TS2339
  proto.cancelBulkEdit = function() { if (this._bulkEdit) this._bulkEdit.cancel(); };

  // Tags
  // @ts-expect-error strict migration — TS2339
  proto.addTag = function(id: string | number, tag: string) { if (this._tags) this._tags.addTag(id, tag); };
  // @ts-expect-error strict migration — TS2339
  proto.removeTag = function(id: string | number, tag: string) { if (this._tags) this._tags.removeTag(id, tag); };
  // @ts-expect-error strict migration — TS2339
  proto.getTags = function(id: string | number) { return this._tags ? this._tags.getTags(id) : []; };

  // Saved Views
  proto.saveCurrentView = function(name: string) {
    if (this._savedViews) {
      // @ts-expect-error strict migration — TS2339
      return this._savedViews.save(name, {
        // @ts-expect-error strict migration — TS2571
        columns: this.columns, sort: this.getSorts(),
        // @ts-expect-error strict migration — TS2339
        groupBy: this._grouping ? this._grouping.get() : null
      });
    }
  };
  // @ts-expect-error strict migration — TS2339
  proto.loadView = function(name: string) { if (this._savedViews) return this._savedViews.load(name); };
  // @ts-expect-error strict migration — TS2339
  proto.getViews = function() { return this._savedViews ? this._savedViews.getAll() : []; };

  // Highlighting Rules
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
  // @ts-expect-error strict migration — TS2339
  proto.clearHighlightRules = function() { if (this._highlightingRules) this._highlightingRules.clear(); };

  // Summary Row
  proto.showSummaryRow = function() {
    if (this._summaryRow) {
      // @ts-expect-error strict migration — TS2339
      this._summaryRow.show();
      // @ts-expect-error strict migration — TS2339
      this._summaryRow.render(this._tbodyEl, this._currentItems);
    }
  };
  // @ts-expect-error strict migration — TS2339
  proto.hideSummaryRow = function() { if (this._summaryRow) this._summaryRow.hide(); };

  // Anomaly Detection
  proto.detectAnomalies = function() {
    // @ts-expect-error strict migration — TS2339
    if (this._anomalyDetector) return this._anomalyDetector.analyze(this._currentItems);
    return [];
  };

  // Badge New
  // @ts-expect-error strict migration — TS2339
  proto.markAsNew = function(ids: unknown[]) { if (this._badgeNew) this._badgeNew.markNew(ids); };
  // @ts-expect-error strict migration — TS2339
  proto.clearNewBadges = function() { if (this._badgeNew) this._badgeNew.clearAll(); };
}
