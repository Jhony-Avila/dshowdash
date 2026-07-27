import { MultiSortManager } from "./multi-sort.js";
import { SortingManager } from "./sorting.js";
import { InlineEditor } from "./inline-edit.js";
import { GroupingManager } from "./grouping.js";
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
const MODULE_ID = "panel-01/ui/table/managers-factory";
function createCoreManagers(table, features, config) {
  const managers = {};
  if (features.multiSort) {
    managers.multiSort = new MultiSortManager({
      maxSorts: config.maxSorts,
      onSort(sorts) {
        if (sorts.length > 0) {
          table.onSort(sorts[0].field, { shiftKey: sorts.length > 1, sorts });
        }
      }
    });
  }
  managers.sorting = new SortingManager({
    defaultField: config.defaultSort.field,
    defaultOrder: config.defaultSort.order,
    onSort(sort) {
      if (!features.multiSort) {
        table.onSort(sort.field, { sorts: [sort] });
      }
    }
  });
  if (features.inlineEdit) {
    managers.inlineEditor = new InlineEditor({
      editableFields: config.editableFields,
      onSave(data) {
        table.onInlineEdit(data);
      },
      onCancel() {
      }
    });
  }
  if (features.grouping) {
    managers.grouping = new GroupingManager({
      onGroupChange(field) {
        table.onGroupChange(field);
      }
    });
  }
  return managers;
}
function createExtendedManagers(table, features, config) {
  const managers = {};
  if (features.columnsManager) {
    managers.columnsManager = new ColumnsManager({
      columns: table.columns,
      onColumnsChange(cols) {
        table.columns = cols;
        table.onColumnsChange(cols);
      }
    });
  }
  if (features.keyboard) {
    managers.keyboard = new KeyboardHandler(table.container, {
      onAction(action, data) {
        table.onKeyboardAction(action, data);
      }
    });
  }
  if (features.bulkEdit) {
    managers.bulkEdit = new BulkEditManager({
      onBulkEdit(ids, field, value) {
        table.onBulkEdit(ids, field, value);
      }
    });
  }
  if (features.tags) {
    managers.tags = new TagsManager({
      onTagsChange(id, tags) {
        table.onTagsChange(id, tags);
      }
    });
  }
  if (features.savedViews) {
    managers.savedViews = new SavedViewsManager({
      onViewChange(view) {
        table.onViewChange(view);
      }
    });
  }
  if (features.badgeNew) {
    managers.badgeNew = new NewBadgeManager({});
  }
  if (features.summaryRow) {
    managers.summaryRow = new SummaryRowManager({
      columns: config.summaryColumns
    });
  }
  if (features.highlightingRules) {
    managers.highlightingRules = new HighlightingRulesManager({
      columns: table.columns,
      rules: config.highlightRules
    });
  }
  if (features.anomalyDetection) {
    managers.anomalyDetector = new AnomalyDetector({
      config: config.anomalyConfig,
      onAnomaly(anomalies) {
        table.onAnomalyDetected(anomalies);
      }
    });
  }
  return managers;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var managers_factory_default = { createCoreManagers, createExtendedManagers };
export {
  MODULE_ID,
  VERSION,
  createCoreManagers,
  createExtendedManagers,
  managers_factory_default as default,
  info
};
