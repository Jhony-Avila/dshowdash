import { ColumnsManager } from "./columns.js";
import { KeyboardHandler } from "./keyboard.js";
import { BulkEditManager } from "./bulk-edit.js";
import { TagsManager } from "./tags.js";
import { SavedViewsManager } from "./saved-views.js";
import { NewBadgeManager } from "./badge-new.js";
import { SummaryRowManager } from "./summary-row.js";
import { HighlightingRulesManager } from "./highlighting-rules.js";
import { AnomalyDetector } from "./anomaly-detection.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/init-extended-managers";
function initExtendedManagers(ctx, features, config, callbacks, columns) {
  const managers = {};
  if (features.columnsManager) {
    managers.columnsManager = new ColumnsManager({
      columns,
      onColumnsChange(cols) {
        callbacks.onColumnsChange(cols);
      }
    });
  }
  if (features.keyboard) {
    managers.keyboard = new KeyboardHandler(ctx.container, {
      onAction(action, data) {
        callbacks.onKeyboardAction(action, data);
      }
    });
  }
  if (features.bulkEdit) {
    managers.bulkEdit = new BulkEditManager({
      onBulkEdit(ids, field, value) {
        callbacks.onBulkEdit(ids, field, value);
      }
    });
  }
  if (features.tags) {
    managers.tags = new TagsManager({
      onTagsChange(id, tags) {
        callbacks.onTagsChange(id, tags);
      }
    });
  }
  if (features.savedViews) {
    managers.savedViews = new SavedViewsManager({
      onViewChange(view) {
        callbacks.onViewChange(view);
      }
    });
  }
  if (features.badgeNew) {
    managers.badgeNew = new NewBadgeManager({});
  }
  if (features.summaryRow) {
    managers.summaryRow = new SummaryRowManager({ columns: config.summaryColumns });
  }
  if (features.highlightingRules) {
    managers.highlightingRules = new HighlightingRulesManager({
      columns,
      rules: config.highlightRules
    });
  }
  if (features.anomalyDetection) {
    managers.anomalyDetector = new AnomalyDetector({
      config: config.anomalyConfig,
      onAnomaly(anomalies) {
        callbacks.onAnomalyDetected(anomalies);
      }
    });
  }
  return managers;
}
export {
  MODULE_ID,
  VERSION,
  initExtendedManagers
};
