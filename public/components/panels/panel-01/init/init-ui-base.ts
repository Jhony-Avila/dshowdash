// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-ui-base
// PURPOSE: Panel-01 - UI Base Components Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   initFeature, safeExecute, loadFeature from ./feature-loader.js
//   FeatureModules from ./feature-registry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONFIG } from '../core/config.js';
import { initFeature, safeExecute, loadFeature } from './feature-loader.js';
import { FeatureModules } from './feature-registry.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:init-ui-base';

export async function initUIBase(ctx: Record<string, unknown>, handlers: Record<string, unknown>, result: Record<string, unknown>) {
  const features = CONFIG.features || {};

  // Drawer
  const drawerModule = await loadFeature('drawer', FeatureModules.drawer);
  if (drawerModule) {
    const DrawerComponent = (drawerModule as Record<string, new (...args: unknown[]) => unknown>).DrawerComponent;
    result.drawer = initFeature('drawer.init', () => new DrawerComponent({ onAction: handlers.onDrawerAction }), { fallback: null });
  }

  // Keyboard
  const keyboardModule = await loadFeature('keyboard', FeatureModules.keyboard);
  if (keyboardModule) {
    result.keyboard = initFeature('keyboard.init', () => {
      const KeyboardHandler = (keyboardModule as Record<string, new (...args: unknown[]) => Record<string, () => void>>).KeyboardHandler;
      const kb = new KeyboardHandler(ctx.wrapper, { onAction: handlers.onKeyboardAction });
      kb.init();
      return kb;
    }, { fallback: null });
  }

  // Context Menu
  const contextMenuModule = await loadFeature('contextMenu', FeatureModules.contextMenu);
  if (contextMenuModule) {
    const ContextMenu = (contextMenuModule as Record<string, new (...args: unknown[]) => unknown>).ContextMenu;
    result.contextMenu = initFeature('contextMenu.init', () => new ContextMenu({ onAction: handlers.onContextAction }), { fallback: null });
  }

  // Filters
  const filtersModule = await loadFeature('filters', FeatureModules.filters);
  if (filtersModule) {
    const filtersEl = ctx.wrapper && (ctx.wrapper as HTMLElement).querySelector('[data-filters]');
    const FiltersManager = (filtersModule as Record<string, new (...args: unknown[]) => Record<string, () => void>>).FiltersManager;
    result.filters = initFeature('filters.init', () => {
      const f = new FiltersManager(filtersEl, {
        onFilterChange: handlers.onFilterChange,
        onClear: handlers.onFilterClear
      });
      f.init();
      return f;
    }, { fallback: null });
  }

  // Actions
  const actionsModule = await loadFeature('actions', FeatureModules.actions);
  if (actionsModule) {
    result.actions = initFeature('actions.init', () => {
      const ActionsHandler = (actionsModule as Record<string, new (...args: unknown[]) => Record<string, () => void>>).ActionsHandler;
      const a = new ActionsHandler(ctx.wrapper, { handlers: handlers.actionHandlers });
      a.init();
      return a;
    }, { fallback: null });
  }

  // Search Component

  if (features.fuzzySearch) {
    const searchModule = await loadFeature('search', FeatureModules.search);
    if (searchModule) {
      const searchEl = ctx.wrapper && (ctx.wrapper as HTMLElement).querySelector('[data-search-container]');
      if (searchEl) {
        const SearchComponent = (searchModule as Record<string, new (...args: unknown[]) => Record<string, () => void>>).SearchComponent;
        result.search = initFeature('search.init', () => {
          const s = new SearchComponent(searchEl, {
            onSearch(query: string) { handlers.onSearch && (handlers.onSearch as (q: string) => void)(query); },
            onClear() { handlers.onSearchClear && (handlers.onSearchClear as () => void)(); },
            debounce: 400,
            minLength: 2
          });
          s.render();
          return s;
        }, { fallback: null });
      }
    }
  }

  // Toolbar
  const toolbarModule = await loadFeature('toolbar', FeatureModules.toolbar);
  if (toolbarModule) {
    const toolbarEl = ctx.wrapper && (ctx.wrapper as HTMLElement).querySelector('[data-toolbar]');
    if (toolbarEl) {
      const ToolbarComponent = (toolbarModule as Record<string, new (...args: unknown[]) => unknown>).ToolbarComponent;
      result.toolbar = initFeature('toolbar.init', () => new ToolbarComponent(toolbarEl, {
        onAction(action: string, value: unknown) { handlers.onToolbarAction && (handlers.onToolbarAction as (a: string, v: unknown) => void)(action, value); }
      }), { fallback: null });
    }
  }

  // Columns Manager
  const columnsModule = await loadFeature('columns', FeatureModules.columns);
  if (columnsModule) {
    result.columns = initFeature('columns.init', () => {
      const ColumnsManager = (columnsModule as Record<string, new (...args: unknown[]) => Record<string, (...a: unknown[]) => void>>).ColumnsManager;
      const c = new ColumnsManager({
        onColumnsChange(cols: unknown[]) {
          if (result.table) (result.table as Record<string, unknown>).columns = cols;
          handlers.onColumnsChange && (handlers.onColumnsChange as (c: unknown[]) => void)(cols);
        }
      });
      c.init();
      const columnsEl = ctx.wrapper && (ctx.wrapper as HTMLElement).querySelector('[data-columns-container]');
      if (columnsEl) c.renderDropdown(columnsEl);
      return c;
    }, { fallback: null });
  }

  // Storage (para uso interno)
  const storageModule = await loadFeature('storage', FeatureModules.storage);
  if (storageModule) { result.storage = storageModule; }

  // Row Hover Menu

  // @ts-expect-error TS migration - TS2339
  if (features.rowHoverMenu !== false) {
    const rowHoverModule = await loadFeature('rowHoverMenu', FeatureModules.rowHoverMenu);
    if (rowHoverModule && (rowHoverModule as Record<string, unknown>).RowHoverMenu) {
      const RowHoverMenu = (rowHoverModule as Record<string, new (...args: unknown[]) => unknown>).RowHoverMenu;
      result.rowHoverMenu = initFeature('rowHoverMenu.init', () => new RowHoverMenu({ onAction: handlers.onRowAction }), { fallback: null });
    }
  }

  // Density & Bulk Action buttons
  if (ctx.wrapper) {
    safeExecute('densityButtons', () => {
      (ctx.wrapper as HTMLElement).querySelectorAll('[data-density]').forEach((btn: Element) => {
        btn.addEventListener('click', () => { handlers.onDensityChange && (handlers.onDensityChange as (d: string | undefined) => void)((btn as HTMLElement).dataset.density); });
      });
    });
    safeExecute('bulkActionButtons', () => {
      (ctx.wrapper as HTMLElement).querySelectorAll('[data-bulk-action]').forEach((btn: Element) => {
        btn.addEventListener('click', () => { handlers.onBulkAction && (handlers.onBulkAction as (a: string | undefined) => void)((btn as HTMLElement).dataset.bulkAction); });
      });
    });
  }

  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initUIBase, info };
