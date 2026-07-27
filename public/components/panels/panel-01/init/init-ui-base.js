import { CONFIG } from "../core/config.js";
import { initFeature, safeExecute, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-ui-base";
async function initUIBase(ctx, handlers, result) {
  const features = CONFIG.features || {};
  const drawerModule = await loadFeature("drawer", FeatureModules.drawer);
  if (drawerModule) {
    const DrawerComponent = drawerModule.DrawerComponent;
    result.drawer = initFeature("drawer.init", () => new DrawerComponent({ onAction: handlers.onDrawerAction }), { fallback: null });
  }
  const keyboardModule = await loadFeature("keyboard", FeatureModules.keyboard);
  if (keyboardModule) {
    result.keyboard = initFeature("keyboard.init", () => {
      const KeyboardHandler = keyboardModule.KeyboardHandler;
      const kb = new KeyboardHandler(ctx.wrapper, { onAction: handlers.onKeyboardAction });
      kb.init();
      return kb;
    }, { fallback: null });
  }
  const contextMenuModule = await loadFeature("contextMenu", FeatureModules.contextMenu);
  if (contextMenuModule) {
    const ContextMenu = contextMenuModule.ContextMenu;
    result.contextMenu = initFeature("contextMenu.init", () => new ContextMenu({ onAction: handlers.onContextAction }), { fallback: null });
  }
  const filtersModule = await loadFeature("filters", FeatureModules.filters);
  if (filtersModule) {
    const filtersEl = ctx.wrapper && ctx.wrapper.querySelector("[data-filters]");
    const FiltersManager = filtersModule.FiltersManager;
    result.filters = initFeature("filters.init", () => {
      const f = new FiltersManager(filtersEl, {
        onFilterChange: handlers.onFilterChange,
        onClear: handlers.onFilterClear
      });
      f.init();
      return f;
    }, { fallback: null });
  }
  const actionsModule = await loadFeature("actions", FeatureModules.actions);
  if (actionsModule) {
    result.actions = initFeature("actions.init", () => {
      const ActionsHandler = actionsModule.ActionsHandler;
      const a = new ActionsHandler(ctx.wrapper, { handlers: handlers.actionHandlers });
      a.init();
      return a;
    }, { fallback: null });
  }
  if (features.fuzzySearch) {
    const searchModule = await loadFeature("search", FeatureModules.search);
    if (searchModule) {
      const searchEl = ctx.wrapper && ctx.wrapper.querySelector("[data-search-container]");
      if (searchEl) {
        const SearchComponent = searchModule.SearchComponent;
        result.search = initFeature("search.init", () => {
          const s = new SearchComponent(searchEl, {
            onSearch(query) {
              handlers.onSearch && handlers.onSearch(query);
            },
            onClear() {
              handlers.onSearchClear && handlers.onSearchClear();
            },
            debounce: 400,
            minLength: 2
          });
          s.render();
          return s;
        }, { fallback: null });
      }
    }
  }
  const toolbarModule = await loadFeature("toolbar", FeatureModules.toolbar);
  if (toolbarModule) {
    const toolbarEl = ctx.wrapper && ctx.wrapper.querySelector("[data-toolbar]");
    if (toolbarEl) {
      const ToolbarComponent = toolbarModule.ToolbarComponent;
      result.toolbar = initFeature("toolbar.init", () => new ToolbarComponent(toolbarEl, {
        onAction(action, value) {
          handlers.onToolbarAction && handlers.onToolbarAction(action, value);
        }
      }), { fallback: null });
    }
  }
  const columnsModule = await loadFeature("columns", FeatureModules.columns);
  if (columnsModule) {
    result.columns = initFeature("columns.init", () => {
      const ColumnsManager = columnsModule.ColumnsManager;
      const c = new ColumnsManager({
        onColumnsChange(cols) {
          if (result.table) result.table.columns = cols;
          handlers.onColumnsChange && handlers.onColumnsChange(cols);
        }
      });
      c.init();
      const columnsEl = ctx.wrapper && ctx.wrapper.querySelector("[data-columns-container]");
      if (columnsEl) c.renderDropdown(columnsEl);
      return c;
    }, { fallback: null });
  }
  const storageModule = await loadFeature("storage", FeatureModules.storage);
  if (storageModule) {
    result.storage = storageModule;
  }
  if (features.rowHoverMenu !== false) {
    const rowHoverModule = await loadFeature("rowHoverMenu", FeatureModules.rowHoverMenu);
    if (rowHoverModule && rowHoverModule.RowHoverMenu) {
      const RowHoverMenu = rowHoverModule.RowHoverMenu;
      result.rowHoverMenu = initFeature("rowHoverMenu.init", () => new RowHoverMenu({ onAction: handlers.onRowAction }), { fallback: null });
    }
  }
  if (ctx.wrapper) {
    safeExecute("densityButtons", () => {
      ctx.wrapper.querySelectorAll("[data-density]").forEach((btn) => {
        btn.addEventListener("click", () => {
          handlers.onDensityChange && handlers.onDensityChange(btn.dataset.density);
        });
      });
    });
    safeExecute("bulkActionButtons", () => {
      ctx.wrapper.querySelectorAll("[data-bulk-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          handlers.onBulkAction && handlers.onBulkAction(btn.dataset.bulkAction);
        });
      });
    });
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_ui_base_default = { initUIBase, info };
export {
  MODULE_ID,
  VERSION,
  init_ui_base_default as default,
  info,
  initUIBase
};
