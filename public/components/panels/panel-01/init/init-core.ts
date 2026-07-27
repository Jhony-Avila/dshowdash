// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-core
// PURPOSE: Panel-01 - Core Components Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   updateBulkActions from ../core/template.js
//   store from ../state/store.js
//   initFeature, safeExecute from ./feature-loader.js
//   ErrorBoundary from ../ui/error-boundary.js
//   SelectionManager from ../ui/selection.js
//   TableComponent from ../ui/table/index.js
//   PaginationComponent from ../ui/pagination.js
//   notifications from ../ui/notifications.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initCoreComponents() — exported function
//   initTableExtensions() — exported function
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

import { CONFIG } from '../core/config.js';
import { updateBulkActions } from '../core/template.js';
import { store } from '../state/store.js';
import { initFeature, safeExecute } from './feature-loader.js';
import { ErrorBoundary } from '../ui/error-boundary.js';
import { SelectionManager } from '../ui/selection.js';
import { TableComponent } from '../ui/table/index.js';
import { PaginationComponent } from '../ui/pagination.js';
import notifications from '../ui/notifications.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:init-core';

export function initCoreComponents(ctx: Record<string, unknown>, handlers: Record<string, unknown>, result: Record<string, unknown>) {
  if (!result) result = {};
  const features: Record<string, unknown> = CONFIG.features || {};

  // 1. Error Boundary - CRITICO
  result.errorBoundary = initFeature('errorBoundary', () => new ErrorBoundary(ctx.contentEl as HTMLElement, {
    onError(err: Error) { notifications.error(`Erro: ${err.message}`); },
    onRetry() { handlers.onRetry && (handlers.onRetry as () => void)(); }
  }), { critical: true });

  // 2. Selection Manager - CRITICO
  result.selection = initFeature('selection', () => new SelectionManager({
    onSelectionChange(data: Record<string, unknown>) {
      updateBulkActions(ctx.wrapper as HTMLElement, data.count as number);
      if (result.haptic) safeExecute('haptic.click', () => { (result.haptic as Record<string, () => void>).click(); });
    }
  }), { critical: true });

  // 3. Table Component - CRITICO
  result.table = initFeature('table', () => new TableComponent(ctx.contentEl as HTMLElement, {
    dragDrop: features.dragDrop,
    resize: features.columnResize,
    multiSort: features.multiSort,
    sticky: features.stickyColumns,
    inlineEdit: features.inlineEdit,
    grouping: true,
    eventManager: true,
    stickyConfig: {
      left: CONFIG.table && CONFIG.table.stickyColumns ? CONFIG.table.stickyColumns.left : ['select', 'id'],
      right: CONFIG.table && CONFIG.table.stickyColumns ? CONFIG.table.stickyColumns.right : ['actions']
    },
    editableFields: CONFIG.table && CONFIG.table.editableFields ? CONFIG.table.editableFields : ['descricao', 'observacao'],
    maxSorts: 3,
    onSort(field: string, event: MouseEvent) { handlers.onSort && (handlers.onSort as (f: string, e: MouseEvent) => void)(field, event); },
    onSelect(id: string | number, checked: boolean) {
      if (result.selection) { checked ? (result.selection as Record<string, (...a: unknown[]) => void>).select(id) : (result.selection as Record<string, (...a: unknown[]) => void>).deselect(id); }
    },
    onSelectAll(checked: boolean) {
      const state = store.getState();
      const ids = state.requisicoes.map((r: Record<string, unknown>) => String(r.id || r.Id_Requisicao));
      if (result.selection) { const sel = result.selection as Record<string, (...a: unknown[]) => void>; checked ? sel.selectAll(ids) : sel.deselectAll(); }
    },
    onRowClick: handlers.onRowClick,
    onRowContext: handlers.onRowContext,
    onColumnReorder(fromIndex: number, toIndex: number) {
      if (result.haptic) safeExecute('haptic.medium', () => { (result.haptic as Record<string, () => void>).medium(); });
      if (result.storage && (result.storage as Record<string, unknown>).saveColumnOrder) {
        safeExecute('storage.saveColumnOrder', () => { (result.storage as Record<string, (...a: unknown[]) => void>).saveColumnOrder((result.table as Record<string, unknown>).columns); });
      }
    },
    onColumnResize(colId: string, width: number) {
      if (result.storage && (result.storage as Record<string, unknown>).setColumnWidth) {
        safeExecute('storage.setColumnWidth', () => { (result.storage as Record<string, (...a: unknown[]) => void>).setColumnWidth(colId, width); });
      }
    },
    onInlineEdit(data: { field: string; newValue: unknown; rowId: string | number }) { handlers.onInlineEdit ? (handlers.onInlineEdit as (d: typeof data) => void)(data) : (ctx.saveInlineEdit && (ctx.saveInlineEdit as (d: typeof data) => void)(data)); },
    onGroupChange(field: string) { handlers.onGroupChange && (handlers.onGroupChange as (f: string) => void)(field); }
  }), { critical: true });

  // 4. Pagination - CRITICO
  result.pagination = initFeature('pagination', () => new PaginationComponent(ctx.paginationEl as HTMLElement, {
    onPageChange: handlers.onPageChange,
    onLimitChange: handlers.onLimitChange
  }), { critical: true });

  // 5. Notifications - CRITICO
  result.notifications = notifications;

  return result;
}

export function initTableExtensions(ctx: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  if (ctx.table) {
    const tbl = ctx.table as Record<string, () => unknown>;
    result.dragDrop = safeExecute('table.getDragDrop', () => tbl.getDragDrop());
    result.columnResize = safeExecute('table.getResize', () => tbl.getResize());
    result.multiSort = safeExecute('table.getMultiSort', () => tbl.getMultiSort());
    result.stickyColumns = safeExecute('table.getSticky', () => tbl.getSticky());
    result.inlineEditor = safeExecute('table.getInlineEditor', () => tbl.getInlineEditor());
    result.grouping = safeExecute('table.getGrouping', () => tbl.getGrouping());
  }
  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initCoreComponents, initTableExtensions, info };
