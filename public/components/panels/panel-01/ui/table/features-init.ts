// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/features-init
// PURPOSE: Panel-01 Table - Features Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ColumnDragDrop from ./drag-drop.js
//   ColumnResize from ./resize.js
//   StickyColumns from ./sticky.js
//   TableEventManager, TABLE_EVENTS from ./events.js
//   RowHoverMenu from ./row-hover-menu.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initDOMFeatures() — exported function
//   applyExtendedFeatures() — exported function
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

import { ColumnDragDrop } from './drag-drop.js';
import { ColumnResize } from './resize.js';
import { StickyColumns } from './sticky.js';
import { TableEventManager, TABLE_EVENTS } from './events.js';
import { RowHoverMenu } from './row-hover-menu.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/features-init';

export function initDOMFeatures(table: Record<string, unknown>) {
  if (!table._tableEl) return;

  const features = table._features as Record<string, unknown>;
  const stickyConfig = table._stickyConfig as Record<string, unknown>;

  // Drag & Drop
  if (features.dragDrop) {
    if (table._dragDrop) (table._dragDrop as Record<string, () => void>).destroy();
    table._dragDrop = new ColumnDragDrop(table._tableEl as HTMLElement, {
      onReorder(fromIndex: number, toIndex: number) {
        reorderColumns(table, fromIndex, toIndex);
        (table.onColumnReorder as (...args: unknown[]) => void)(fromIndex, toIndex);
      }
    });
    (table._dragDrop as Record<string, () => void>).init();
  }

  // Column Resize
  if (features.resize) {
    if (table._resize) (table._resize as Record<string, () => void>).destroy();
    table._resize = new ColumnResize(table._tableEl as HTMLElement, {
      onResize(colId: string, width: number) {
        (table.onColumnResize as (...args: unknown[]) => void)(colId, width);
      }
    });
    (table._resize as Record<string, () => void>).init();
  }

  // Sticky Columns
  if (features.sticky) {
    if (table._sticky) (table._sticky as Record<string, () => void>).remove();
    table._sticky = new StickyColumns(table._tableEl as HTMLElement, {
      leftColumns: stickyConfig.left,
      rightColumns: stickyConfig.right
    });
    (table._sticky as Record<string, () => void>).apply();
  }

  // Event Manager
  if (features.eventManager) {
    if (table._eventManager) (table._eventManager as Record<string, () => void>).destroy();
    table._eventManager = new TableEventManager(table.container as HTMLElement, {
      handlers: {
        [TABLE_EVENTS.ROW_HOVER]: function(data: Record<string, unknown>) { onRowHover(table, data); }
      }
    });
    (table._eventManager as Record<string, () => void>).init();
  }

  // Row Hover Menu
  if (features.rowHoverMenu) {
    if (table._rowHoverMenu) (table._rowHoverMenu as Record<string, () => void>).destroy();
    table._rowHoverMenu = new (RowHoverMenu as unknown as new (...args: unknown[]) => unknown)({
      container: table.container,
      actions: table._hoverMenuActions,
      onAction(action: string, id: string) { (table.onRowClick as (a: string, id: string) => void)(action, id); }
    });
    (table._rowHoverMenu as Record<string, () => void>).init();
  }

  // Keyboard handler init
  if (table._keyboard && features.keyboard) {
    (table._keyboard as Record<string, () => void>).init();
  }
}

function reorderColumns(table: Record<string, unknown>, fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return;
  const cols = table.columns as unknown[];
  const col = cols.splice(fromIndex, 1)[0];
  cols.splice(toIndex, 0, col);
}

function onRowHover(_table: Record<string, unknown>, _data: Record<string, unknown>) {
  // Row hover menu is handled by RowHoverMenu module
}

export function applyExtendedFeatures(table: Record<string, unknown>, items: Record<string, unknown>[]) {
  // Apply highlighting rules to rows
  if (table._highlightingRules && table._features && (table._features as Record<string, unknown>).highlightingRules && table._tbodyEl) {
    const rows = (table._tbodyEl as HTMLElement).querySelectorAll(".p01-row");
    rows.forEach((row: Element) => {
      const rowId = (row as HTMLElement).dataset.id;
      const rowData = items.find((i: Record<string, unknown>) => String(i.id || i.Id_Requisicao) === rowId);
      if (rowData) {
        const style = (table._highlightingRules as Record<string, (...args: unknown[]) => unknown>).applyToRow(rowData);
        if (style) (row as HTMLElement).style.backgroundColor = style as string;
      }
    });
  }

  // Detect anomalies
  if (table._anomalyDetector && (table._features as Record<string, unknown>).anomalyDetection) {
    (table._anomalyDetector as Record<string, (...args: unknown[]) => unknown>).setData(items);
    const anomalies = (table._anomalyDetector as Record<string, () => unknown>).getAnomalies();
    if (anomalies && (anomalies as unknown[]).length > 0) (table.onAnomalyDetected as (...args: unknown[]) => void)(anomalies);
  }

  // Check for new items
  if (table._badgeNew && (table._features as Record<string, unknown>).badgeNew) {
    (table._badgeNew as Record<string, (...args: unknown[]) => void>).checkNewItems(items);
  }

  // Calculate summary
  if (table._summaryRow && (table._features as Record<string, unknown>).summaryRow) {
    (table._summaryRow as Record<string, (...args: unknown[]) => void>).setData(items);
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initDOMFeatures, applyExtendedFeatures };
