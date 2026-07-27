import { ColumnDragDrop } from "./drag-drop.js";
import { ColumnResize } from "./resize.js";
import { StickyColumns } from "./sticky.js";
import { TableEventManager, TABLE_EVENTS } from "./events.js";
import { RowHoverMenu } from "./row-hover-menu.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/features-init";
function initDOMFeatures(table) {
  if (!table._tableEl) return;
  const features = table._features;
  const stickyConfig = table._stickyConfig;
  if (features.dragDrop) {
    if (table._dragDrop) table._dragDrop.destroy();
    table._dragDrop = new ColumnDragDrop(table._tableEl, {
      onReorder(fromIndex, toIndex) {
        reorderColumns(table, fromIndex, toIndex);
        table.onColumnReorder(fromIndex, toIndex);
      }
    });
    table._dragDrop.init();
  }
  if (features.resize) {
    if (table._resize) table._resize.destroy();
    table._resize = new ColumnResize(table._tableEl, {
      onResize(colId, width) {
        table.onColumnResize(colId, width);
      }
    });
    table._resize.init();
  }
  if (features.sticky) {
    if (table._sticky) table._sticky.remove();
    table._sticky = new StickyColumns(table._tableEl, {
      leftColumns: stickyConfig.left,
      rightColumns: stickyConfig.right
    });
    table._sticky.apply();
  }
  if (features.eventManager) {
    if (table._eventManager) table._eventManager.destroy();
    table._eventManager = new TableEventManager(table.container, {
      handlers: {
        [TABLE_EVENTS.ROW_HOVER]: function(data) {
          onRowHover(table, data);
        }
      }
    });
    table._eventManager.init();
  }
  if (features.rowHoverMenu) {
    if (table._rowHoverMenu) table._rowHoverMenu.destroy();
    table._rowHoverMenu = new RowHoverMenu({
      container: table.container,
      actions: table._hoverMenuActions,
      onAction(action, id) {
        table.onRowClick(action, id);
      }
    });
    table._rowHoverMenu.init();
  }
  if (table._keyboard && features.keyboard) {
    table._keyboard.init();
  }
}
function reorderColumns(table, fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  const cols = table.columns;
  const col = cols.splice(fromIndex, 1)[0];
  cols.splice(toIndex, 0, col);
}
function onRowHover(_table, _data) {
}
function applyExtendedFeatures(table, items) {
  if (table._highlightingRules && table._features && table._features.highlightingRules && table._tbodyEl) {
    const rows = table._tbodyEl.querySelectorAll(".p01-row");
    rows.forEach((row) => {
      const rowId = row.dataset.id;
      const rowData = items.find((i) => String(i.id || i.Id_Requisicao) === rowId);
      if (rowData) {
        const style = table._highlightingRules.applyToRow(rowData);
        if (style) row.style.backgroundColor = style;
      }
    });
  }
  if (table._anomalyDetector && table._features.anomalyDetection) {
    table._anomalyDetector.setData(items);
    const anomalies = table._anomalyDetector.getAnomalies();
    if (anomalies && anomalies.length > 0) table.onAnomalyDetected(anomalies);
  }
  if (table._badgeNew && table._features.badgeNew) {
    table._badgeNew.checkNewItems(items);
  }
  if (table._summaryRow && table._features.summaryRow) {
    table._summaryRow.setData(items);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var features_init_default = { initDOMFeatures, applyExtendedFeatures };
export {
  MODULE_ID,
  VERSION,
  applyExtendedFeatures,
  features_init_default as default,
  info,
  initDOMFeatures
};
