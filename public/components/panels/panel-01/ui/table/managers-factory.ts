// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/managers-factory
// PURPOSE: Panel-01 Table - Managers Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MultiSortManager from ./multi-sort.js
//   SortingManager from ./sorting.js
//   InlineEditor from ./inline-edit.js
//   GroupingManager from ./grouping.js
//   ColumnsManager from ./columns.js
//   KeyboardHandler from ./keyboard.js
//   BulkEditManager from ./bulk-edit.js
//   TagsManager from ./tags.js
//   SavedViewsManager from ./saved-views.js
//   NewBadgeManager from ./badge-new.js
//   SummaryRowManager from ./summary-row.js
//   HighlightingRulesManager from ./highlighting-rules.js
//   AnomalyDetector from ./anomaly-detection.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createCoreManagers() — exported function
//   createExtendedManagers() — exported function
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

import { MultiSortManager } from './multi-sort.js';
import { SortingManager } from './sorting.js';
import { InlineEditor } from './inline-edit.js';
import { GroupingManager } from './grouping.js';
import { ColumnsManager } from './columns.js';
import { KeyboardHandler } from './keyboard.js';
import { BulkEditManager } from './bulk-edit.js';
import { TagsManager } from './tags.js';
import { SavedViewsManager } from './saved-views.js';
import { NewBadgeManager } from './badge-new.js';
import { SummaryRowManager } from './summary-row.js';
import { HighlightingRulesManager } from './highlighting-rules.js';
import { AnomalyDetector } from './anomaly-detection.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/managers-factory';

export function createCoreManagers(table: Record<string, unknown>, features: Record<string, unknown>, config: Record<string, unknown>) {
  const managers: Record<string, unknown> = {};

  // Multi-sort manager
  if (features.multiSort) {
    managers.multiSort = new MultiSortManager({
      maxSorts: config.maxSorts,
      onSort(sorts: Record<string, unknown>[]) {
        if (sorts.length > 0) {
          (table.onSort as (...args: unknown[]) => void)((sorts[0] as Record<string, unknown>).field, { shiftKey: sorts.length > 1, sorts });
        }
      }
    });
  }

  // Single sort manager (fallback)
  managers.sorting = new SortingManager({
    defaultField: (config.defaultSort as Record<string, unknown>).field,
    defaultOrder: (config.defaultSort as Record<string, unknown>).order,
    onSort(sort: Record<string, unknown>) {
      if (!features.multiSort) {
        (table.onSort as (...args: unknown[]) => void)(sort.field, { sorts: [sort] });
      }
    }
  });

  // Inline editor
  if (features.inlineEdit) {
    managers.inlineEditor = new InlineEditor({
      editableFields: config.editableFields,
      onSave(data: unknown) { (table.onInlineEdit as (...args: unknown[]) => void)(data); },
      onCancel() {}
    });
  }

  // Grouping manager
  if (features.grouping) {
    managers.grouping = new GroupingManager({
      onGroupChange(field: string) { (table.onGroupChange as (...args: unknown[]) => void)(field); }
    });
  }

  return managers;
}

export function createExtendedManagers(table: Record<string, unknown>, features: Record<string, unknown>, config: Record<string, unknown>) {
  const managers: Record<string, unknown> = {};

  // Columns manager
  if (features.columnsManager) {
    managers.columnsManager = new ColumnsManager({
      columns: table.columns,
      onColumnsChange(cols: unknown[]) {
        table.columns = cols;
        (table.onColumnsChange as (...args: unknown[]) => void)(cols);
      }
    });
  }

  // Keyboard handler
  if (features.keyboard) {
    managers.keyboard = new KeyboardHandler(table.container as HTMLElement, {
      onAction(action: string, data: unknown) { (table.onKeyboardAction as (...args: unknown[]) => void)(action, data); }
    });
  }

  // Bulk edit manager
  if (features.bulkEdit) {
    managers.bulkEdit = new BulkEditManager({
      onBulkEdit(ids: unknown[], field: string, value: unknown) { (table.onBulkEdit as (...args: unknown[]) => void)(ids, field, value); }
    });
  }

  // Tags manager
  if (features.tags) {
    managers.tags = new TagsManager({
      onTagsChange(id: string, tags: unknown) { (table.onTagsChange as (...args: unknown[]) => void)(id, tags); }
    });
  }

  // Saved views manager
  if (features.savedViews) {
    managers.savedViews = new SavedViewsManager({
      onViewChange(view: unknown) { (table.onViewChange as (...args: unknown[]) => void)(view); }
    });
  }

  // Badge new manager
  if (features.badgeNew) {
    managers.badgeNew = new NewBadgeManager({});
  }

  // Summary row manager
  if (features.summaryRow) {
    managers.summaryRow = new (SummaryRowManager as unknown as new (...args: unknown[]) => unknown)({
      columns: config.summaryColumns
    });
  }

  // Highlighting rules manager
  if (features.highlightingRules) {
    managers.highlightingRules = new (HighlightingRulesManager as unknown as new (...args: unknown[]) => unknown)({
      columns: table.columns,
      rules: config.highlightRules
    });
  }

  // Anomaly detector
  if (features.anomalyDetection) {
    managers.anomalyDetector = new (AnomalyDetector as unknown as new (...args: unknown[]) => unknown)({
      config: config.anomalyConfig,
      onAnomaly(anomalies: unknown) { (table.onAnomalyDetected as (...args: unknown[]) => void)(anomalies); }
    });
  }

  return managers;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { createCoreManagers, createExtendedManagers };
