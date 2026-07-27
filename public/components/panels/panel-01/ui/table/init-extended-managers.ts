// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/init-extended-managers
// PURPOSE: Panel-01 Table - Extended Managers Initialization
// ───────────────────────────────────────────────────────────────
// IMPORTS:
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
//   initExtendedManagers() — exported function
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
export const MODULE_ID = 'panel-01/ui/table/init-extended-managers';

export function initExtendedManagers(ctx: Record<string, unknown>, features: Record<string, unknown>, config: Record<string, unknown>, callbacks: Record<string, (...args: unknown[]) => void>, columns: unknown[]) {
  const managers: Record<string, unknown> = {};

  if (features.columnsManager) {
    managers.columnsManager = new ColumnsManager({
      columns,
      onColumnsChange(cols: unknown[]) { callbacks.onColumnsChange(cols); }
    });
  }

  if (features.keyboard) {
    managers.keyboard = new KeyboardHandler(ctx.container as HTMLElement, {
      onAction(action: string, data: unknown) { callbacks.onKeyboardAction(action, data); }
    });
  }

  if (features.bulkEdit) {
    managers.bulkEdit = new BulkEditManager({
      onBulkEdit(ids: unknown[], field: string, value: unknown) { callbacks.onBulkEdit(ids, field, value); }
    });
  }

  if (features.tags) {
    managers.tags = new TagsManager({
      onTagsChange(id: string, tags: unknown) { callbacks.onTagsChange(id, tags); }
    });
  }

  if (features.savedViews) {
    managers.savedViews = new SavedViewsManager({
      onViewChange(view: unknown) { callbacks.onViewChange(view); }
    });
  }

  if (features.badgeNew) {
    managers.badgeNew = new NewBadgeManager({});
  }

  if (features.summaryRow) {

    // @ts-expect-error strict migration — TS7009
    managers.summaryRow = new SummaryRowManager({ columns: config.summaryColumns });
  }

  if (features.highlightingRules) {

    // @ts-expect-error strict migration — TS7009
    managers.highlightingRules = new HighlightingRulesManager({
      columns,
      rules: config.highlightRules
    });
  }

  if (features.anomalyDetection) {

    // @ts-expect-error strict migration — TS7009
    managers.anomalyDetector = new AnomalyDetector({
      config: config.anomalyConfig,
      onAnomaly(anomalies: unknown) { callbacks.onAnomalyDetected(anomalies); }
    });
  }

  return managers;
}
