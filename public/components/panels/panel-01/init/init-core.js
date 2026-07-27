import { CONFIG } from "../core/config.js";
import { updateBulkActions } from "../core/template.js";
import { store } from "../state/store.js";
import { initFeature, safeExecute } from "./feature-loader.js";
import { ErrorBoundary } from "../ui/error-boundary.js";
import { SelectionManager } from "../ui/selection.js";
import { TableComponent } from "../ui/table/index.js";
import { PaginationComponent } from "../ui/pagination.js";
import notifications from "../ui/notifications.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-core";
function initCoreComponents(ctx, handlers, result) {
  if (!result) result = {};
  const features = CONFIG.features || {};
  result.errorBoundary = initFeature("errorBoundary", () => new ErrorBoundary(ctx.contentEl, {
    onError(err) {
      notifications.error(`Erro: ${err.message}`);
    },
    onRetry() {
      handlers.onRetry && handlers.onRetry();
    }
  }), { critical: true });
  result.selection = initFeature("selection", () => new SelectionManager({
    onSelectionChange(data) {
      updateBulkActions(ctx.wrapper, data.count);
      if (result.haptic) safeExecute("haptic.click", () => {
        result.haptic.click();
      });
    }
  }), { critical: true });
  result.table = initFeature("table", () => new TableComponent(ctx.contentEl, {
    dragDrop: features.dragDrop,
    resize: features.columnResize,
    multiSort: features.multiSort,
    sticky: features.stickyColumns,
    inlineEdit: features.inlineEdit,
    grouping: true,
    eventManager: true,
    stickyConfig: {
      left: CONFIG.table && CONFIG.table.stickyColumns ? CONFIG.table.stickyColumns.left : ["select", "id"],
      right: CONFIG.table && CONFIG.table.stickyColumns ? CONFIG.table.stickyColumns.right : ["actions"]
    },
    editableFields: CONFIG.table && CONFIG.table.editableFields ? CONFIG.table.editableFields : ["descricao", "observacao"],
    maxSorts: 3,
    onSort(field, event) {
      handlers.onSort && handlers.onSort(field, event);
    },
    onSelect(id, checked) {
      if (result.selection) {
        checked ? result.selection.select(id) : result.selection.deselect(id);
      }
    },
    onSelectAll(checked) {
      const state = store.getState();
      const ids = state.requisicoes.map((r) => String(r.id || r.Id_Requisicao));
      if (result.selection) {
        const sel = result.selection;
        checked ? sel.selectAll(ids) : sel.deselectAll();
      }
    },
    onRowClick: handlers.onRowClick,
    onRowContext: handlers.onRowContext,
    onColumnReorder(fromIndex, toIndex) {
      if (result.haptic) safeExecute("haptic.medium", () => {
        result.haptic.medium();
      });
      if (result.storage && result.storage.saveColumnOrder) {
        safeExecute("storage.saveColumnOrder", () => {
          result.storage.saveColumnOrder(result.table.columns);
        });
      }
    },
    onColumnResize(colId, width) {
      if (result.storage && result.storage.setColumnWidth) {
        safeExecute("storage.setColumnWidth", () => {
          result.storage.setColumnWidth(colId, width);
        });
      }
    },
    onInlineEdit(data) {
      handlers.onInlineEdit ? handlers.onInlineEdit(data) : ctx.saveInlineEdit && ctx.saveInlineEdit(data);
    },
    onGroupChange(field) {
      handlers.onGroupChange && handlers.onGroupChange(field);
    }
  }), { critical: true });
  result.pagination = initFeature("pagination", () => new PaginationComponent(ctx.paginationEl, {
    onPageChange: handlers.onPageChange,
    onLimitChange: handlers.onLimitChange
  }), { critical: true });
  result.notifications = notifications;
  return result;
}
function initTableExtensions(ctx) {
  const result = {};
  if (ctx.table) {
    const tbl = ctx.table;
    result.dragDrop = safeExecute("table.getDragDrop", () => tbl.getDragDrop());
    result.columnResize = safeExecute("table.getResize", () => tbl.getResize());
    result.multiSort = safeExecute("table.getMultiSort", () => tbl.getMultiSort());
    result.stickyColumns = safeExecute("table.getSticky", () => tbl.getSticky());
    result.inlineEditor = safeExecute("table.getInlineEditor", () => tbl.getInlineEditor());
    result.grouping = safeExecute("table.getGrouping", () => tbl.getGrouping());
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_core_default = { initCoreComponents, initTableExtensions, info };
export {
  MODULE_ID,
  VERSION,
  init_core_default as default,
  info,
  initCoreComponents,
  initTableExtensions
};
