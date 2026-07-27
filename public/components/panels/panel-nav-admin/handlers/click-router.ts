// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin/handlers/click-router
// PURPOSE: Click Router - Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   flipCard, toggleCollapse from ../renderer/sections.js
//   selectRow, selectAllRows from ../renderer/items.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ACTIONS — exported value
//   createClickRouter() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import * as crud from './crud.js';
import * as uiActions from './ui-actions.js';
import { flipCard, toggleCollapse } from '../renderer/sections.js';
import { selectRow, selectAllRows } from '../renderer/items.js';

export const VERSION = '15.0.0-FLAT-GROUP-COLLAPSE';
export const MODULE_ID = 'panel-nav-admin/handlers/click-router';

export const ACTIONS = {
  REFRESH: 'refresh',
  CREATE_ITEM: 'create-item',
  DELETE_ITEM: 'delete-item',
  TOGGLE_ACTIVE: 'toggle-active',
  CREATE_SECTION: 'create-section',
  EDIT_SECTION: 'edit-section',
  DELETE_SECTION: 'delete-section',
  FLIP_CARD: 'flip-card',
  TOGGLE_COLLAPSE: 'toggle-collapse',
  CLOSE_MODAL: 'close-modal',
  DISMISS_ERROR: 'dismiss-error',
  CONFIRM_DELETE_ITEM: 'confirm-delete-item',
  CONFIRM_DELETE_SECTION: 'confirm-delete-section',
  RETRY: 'retry',
  TOGGLE_QUICK_MENU: 'toggle-quick-menu',
  IMPORT: 'import',
  EXPORT_CSV: 'export-csv',
  DUPLICATE: 'duplicate',
  BULK_DELETE: 'bulk-delete',
  SETTINGS: 'settings',
  TOGGLE_REFRESH: 'toggle-refresh',
  PAUSE_REFRESH: 'pause-refresh',
  RESUME_REFRESH: 'resume-refresh',
  LOAD_DIAGNOSTIC: 'load-diagnostic',
  REFRESH_DIAGNOSTIC: 'refresh-diagnostic',
  VALIDATE_ROUTE: 'validate-route',
  EXPORT: 'export',
  AUDIT_HISTORY: 'audit-history',
  REMOVE_FILTER_CHIP: 'remove-filter-chip',
  TOGGLE_ADVANCED_FILTERS: 'toggle-advanced-filters',
  CLEAR_SEARCH: 'clear-search',
  SELECT_ALL: 'select-all',
  SELECT_ITEM: 'select-item',
  BULK_DELETE_SELECTED: 'bulk-delete-selected',
  BULK_ACTIVATE_SELECTED: 'bulk-activate-selected',
  BULK_DEACTIVATE_SELECTED: 'bulk-deactivate-selected',
  BULK_CLEAR_SELECTION: 'bulk-clear-selection',
  HEALTH_STATUS: 'health-status',
  RESET_DISPLAY_TITLE: 'reset-display-title',
  BULK_SET_TITLE: 'bulk-set-title',
  DUPLICATE_ITEM: 'duplicate-item',
  TOGGLE_GROUP_VIEW: 'toggle-group-view',
  TOGGLE_COMPACT_MODE: 'toggle-compact-mode',
  INLINE_EDIT_GROUP_LABEL: 'inline-edit-group-label',
  NEW_GROUP: 'new-group',
  TOGGLE_FLAT_GROUP_COLLAPSE: 'toggle-flat-group-collapse'
};

interface ClickRouterDeps {
  container: HTMLElement;
  refs: Record<string, HTMLElement>;
  store: { setActiveTab: (tab: string) => void };
  scheduler: { refresh: () => void; toggle: () => void; pause: () => void; resume: () => void };
  callbacks: Record<string, unknown>;
  handlers: Record<string, ((...args: unknown[]) => void) | undefined>;
}

export function createClickRouter(deps: ClickRouterDeps) {
  const container = deps.container;
  const refs = deps.refs;
  const store = deps.store;
  const scheduler = deps.scheduler;
  const callbacks = deps.callbacks;
  const handlers = deps.handlers;

  return function routeClick(e: MouseEvent) {
    const el = e.target as HTMLElement;
    const target = el.closest('[data-action]') as HTMLElement | null;
    const tabTarget = el.closest('[data-tab]') as HTMLElement | null;
    const kpiTarget = el.closest('[data-kpi]') as HTMLElement | null;

    if (kpiTarget && !target) {
      if (handlers.onKpiClick) handlers.onKpiClick(kpiTarget);
      return;
    }

    if (tabTarget && !target) {
      const tab = tabTarget.dataset.tab;
      // @ts-expect-error strict migration — TS2345
      store.setActiveTab(tab);
      return;
    }

    if (!target) return;
    
    const action = target.dataset.action;
    const itemIdEl = el.closest('[data-item-id]') as HTMLElement | null;
    const sectionKeyEl = el.closest('[data-section-key]') as HTMLElement | null;
    const itemId = target.dataset.itemId || (itemIdEl ? itemIdEl.dataset.itemId : null);
    const sectionKey = target.dataset.sectionKey || (sectionKeyEl ? sectionKeyEl.dataset.sectionKey : null);

    switch (action) {
      case ACTIONS.REFRESH: 
        scheduler.refresh(); 
        break;
      
      case ACTIONS.CREATE_ITEM:
        if (handlers.onCreateItem) handlers.onCreateItem();
        else crud.openItemForm(container);
        break;
      case ACTIONS.DELETE_ITEM:
        // @ts-expect-error strict migration — TS2345
        crud.confirmDeleteItem(container, itemId, callbacks, target);
        break;
      case ACTIONS.TOGGLE_ACTIVE: 
        if (handlers.onToggleActive) handlers.onToggleActive(itemId); 
        break;
      
      case ACTIONS.CREATE_SECTION: 
        crud.openSectionForm(container); 
        break;
      case ACTIONS.EDIT_SECTION: {
        // Grupos dinâmicos (gerados a partir de itens) não têm tabela própria.
        // Detectar por prefixo sidebar.grp- e exibir toast informativo.
        const _isDynamic = sectionKey && sectionKey.startsWith('sidebar.grp-');
        if (_isDynamic) {
          const _toast = (callbacks as Record<string, unknown>).showToast as ((msg: string, type: string) => void) | undefined;
          if (_toast) _toast('Este grupo é gerado dinamicamente a partir dos itens. Para editar o grupo, edite os itens que pertencem a ele.', 'info');
        } else {
          crud.openSectionForm(container, sectionKey);
        }
        break;
      }
      case ACTIONS.DELETE_SECTION: 
        // @ts-expect-error strict migration — TS2345
        crud.confirmDeleteSection(container, sectionKey); 
        break;
      
      case ACTIONS.FLIP_CARD: {
        const card = target.closest('[data-section-key]');
        // @ts-expect-error strict migration — TS2345
        if (card) flipCard((card as HTMLElement).dataset.sectionKey);
        break;
      }
      case ACTIONS.TOGGLE_COLLAPSE: {
        const collapseCard = target.closest('[data-section-key]');
        // @ts-expect-error strict migration — TS2345
        if (collapseCard) toggleCollapse((collapseCard as HTMLElement).dataset.sectionKey);
        break;
      }
      
      case ACTIONS.CLOSE_MODAL: 
        uiActions.closeAllModals(container); 
        break;
      case ACTIONS.DISMISS_ERROR: 
        if (handlers.onDismissError) handlers.onDismissError(); 
        break;
      case ACTIONS.CONFIRM_DELETE_ITEM: 
        crud.executeDeleteItem(callbacks);
        break;
      case ACTIONS.CONFIRM_DELETE_SECTION: 
        crud.executeDeleteSection(callbacks); 
        break;
      case ACTIONS.RETRY: 
        if (handlers.onRetry) handlers.onRetry(); 
        break;
      
      case ACTIONS.TOGGLE_QUICK_MENU: 
        if (refs && refs.quickActions) refs.quickActions.classList.toggle('open');
        break;
      case ACTIONS.IMPORT: 
        if (handlers.onImport) handlers.onImport(); 
        break;
      case ACTIONS.EXPORT_CSV: 
        if (handlers.onExportCSV) handlers.onExportCSV(); 
        break;
      case ACTIONS.DUPLICATE: 
        if (handlers.onDuplicate) handlers.onDuplicate(); 
        break;
      case ACTIONS.BULK_DELETE: 
        if (handlers.onBulkDelete) handlers.onBulkDelete(); 
        break;
      case ACTIONS.SETTINGS: 
        if (handlers.onSettings) handlers.onSettings(); 
        break;
      
      case ACTIONS.TOGGLE_REFRESH: 
        scheduler.toggle(); 
        break;
      case ACTIONS.PAUSE_REFRESH: 
        scheduler.pause(); 
        break;
      case ACTIONS.RESUME_REFRESH: 
        scheduler.resume(); 
        break;
      
      case ACTIONS.LOAD_DIAGNOSTIC:
      case ACTIONS.REFRESH_DIAGNOSTIC: 
        if (handlers.onLoadDiagnostic) handlers.onLoadDiagnostic(); 
        break;
      case ACTIONS.VALIDATE_ROUTE: 
        if (handlers.onValidateRoute) handlers.onValidateRoute(); 
        break;
      
      case ACTIONS.EXPORT:
        if (handlers.onExport) handlers.onExport();
        break;

      case ACTIONS.AUDIT_HISTORY:
        if (handlers.onAuditHistory) handlers.onAuditHistory();
        break;

      case ACTIONS.REMOVE_FILTER_CHIP: 
        if (handlers.onRemoveFilterChip) handlers.onRemoveFilterChip(target.dataset.filter); 
        break;
      case ACTIONS.TOGGLE_ADVANCED_FILTERS: 
        if (handlers.onToggleAdvancedFilters) handlers.onToggleAdvancedFilters(); 
        break;
      case ACTIONS.CLEAR_SEARCH: 
        if (handlers.onClearSearch) handlers.onClearSearch(); 
        break;
      
      case ACTIONS.SELECT_ALL: 

        // @ts-expect-error TS migration - TS2554
        selectAllRows(target.checked); 
        break;
      case ACTIONS.SELECT_ITEM:
        // @ts-expect-error strict migration — TS2345
        selectRow(itemId, (target as HTMLInputElement).checked);
        break;

      case ACTIONS.BULK_DELETE_SELECTED:
        if (handlers.onBulkDeleteSelected) handlers.onBulkDeleteSelected();
        break;
      case ACTIONS.BULK_ACTIVATE_SELECTED:
        if (handlers.onBulkActivateSelected) handlers.onBulkActivateSelected();
        break;
      case ACTIONS.BULK_DEACTIVATE_SELECTED:
        if (handlers.onBulkDeactivateSelected) handlers.onBulkDeactivateSelected();
        break;
      case ACTIONS.BULK_CLEAR_SELECTION:
        if (handlers.onBulkClearSelection) handlers.onBulkClearSelection();
        break;

      case ACTIONS.HEALTH_STATUS:
        if (handlers.onHealthStatus) handlers.onHealthStatus();
        break;

      case ACTIONS.RESET_DISPLAY_TITLE:
        if (handlers.onResetDisplayTitle) handlers.onResetDisplayTitle(target);
        break;

      case ACTIONS.BULK_SET_TITLE:
        if (handlers.onBulkSetTitle) handlers.onBulkSetTitle();
        break;

      case ACTIONS.DUPLICATE_ITEM:
        if (handlers.onDuplicateItem) handlers.onDuplicateItem(itemId, target);
        break;

      case ACTIONS.TOGGLE_GROUP_VIEW:
        if (handlers.onToggleGroupView) handlers.onToggleGroupView();
        break;

      case ACTIONS.TOGGLE_COMPACT_MODE:
        if (handlers.onToggleCompactMode) handlers.onToggleCompactMode();
        break;

      // MELHORIA 7: Inline edit group label
      case ACTIONS.INLINE_EDIT_GROUP_LABEL:
        if (handlers.onInlineEditGroupLabel) handlers.onInlineEditGroupLabel(target);
        break;

      // MELHORIA 6: New group
      case ACTIONS.NEW_GROUP:
        if (handlers.onNewGroup) handlers.onNewGroup();
        break;

      // v15.0.0: Flat group collapse/expand
      case ACTIONS.TOGGLE_FLAT_GROUP_COLLAPSE:
        if (handlers.onToggleFlatGroupCollapse) handlers.onToggleFlatGroupCollapse(target);
        break;
    }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
