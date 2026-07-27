import { CONFIG } from "../core/config.js";
import { store } from "../state/store.js";
import { initFeature, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-search-filters";
async function initSearchFilters(ctx, handlers, result) {
  const features = CONFIG.features || {};
  if (features.searchSuggestions !== false) {
    const suggestionsModule = await loadFeature("searchSuggestions", FeatureModules.searchSuggestions);
    if (suggestionsModule && suggestionsModule.SearchSuggestions) {
      const SearchSuggestions = suggestionsModule.SearchSuggestions;
      const searchInput = ctx.wrapper && ctx.wrapper.querySelector('[data-search-input], input[type="search"], .p01-search-input');
      if (searchInput) {
        result.searchSuggestions = initFeature("searchSuggestions.init", () => new SearchSuggestions(searchInput, {
          onSelect(item) {
            handlers.onSearch && handlers.onSearch(item.text);
          }
        }), { fallback: null });
      }
    }
  }
  if (features.searchHistory !== false) {
    const historyModule = await loadFeature("searchHistory", FeatureModules.searchHistory);
    if (historyModule && historyModule.SearchHistory) {
      const SearchHistory = historyModule.SearchHistory;
      const searchInput = ctx.wrapper && ctx.wrapper.querySelector('[data-search-input], input[type="search"], .p01-search-input');
      if (searchInput) {
        result.searchHistory = initFeature("searchHistory.init", () => new SearchHistory(searchInput, {
          onSelect(term) {
            handlers.onSearch && handlers.onSearch(term);
          }
        }), { fallback: null });
      }
    }
  }
  if (features.filterPresets !== false) {
    const presetsModule = await loadFeature("filterPresets", FeatureModules.filterPresets);
    if (presetsModule && presetsModule.FilterPresetsManager) {
      const FilterPresetsManager = presetsModule.FilterPresetsManager;
      result.filterPresets = initFeature("filterPresets.init", () => new FilterPresetsManager({
        onApply(preset) {
          if (preset.filters) {
            Object.keys(preset.filters).forEach((key) => {
              store.setFilter(key, preset.filters[key]);
            });
            handlers.onFilterChange && handlers.onFilterChange();
          }
        }
      }), { fallback: null });
    }
  }
  if (features.dateRangePicker !== false) {
    const dateRangeModule = await loadFeature("dateRangePicker", FeatureModules.dateRangePicker);
    if (dateRangeModule && dateRangeModule.DateRangePicker) {
      const DateRangePicker = dateRangeModule.DateRangePicker;
      const dateRangeEl = ctx.wrapper && ctx.wrapper.querySelector("[data-date-range], .p01-date-range");
      if (dateRangeEl) {
        result.dateRangePicker = initFeature("dateRangePicker.init", () => new DateRangePicker(dateRangeEl, {
          onChange(range) {
            store.setFilter("dataInicio", range.start);
            store.setFilter("dataFim", range.end);
            handlers.onFilterChange && handlers.onFilterChange();
          }
        }), { fallback: null });
      }
    }
  }
  if (features.numericRangeFilter !== false) {
    const numericModule = await loadFeature("numericRangeFilter", FeatureModules.numericRangeFilter);
    if (numericModule && numericModule.NumericRangeFilter) {
      const NumericRangeFilter = numericModule.NumericRangeFilter;
      const numericEl = ctx.wrapper && ctx.wrapper.querySelector("[data-numeric-range], .p01-numeric-range");
      if (numericEl) {
        result.numericRangeFilter = initFeature("numericRangeFilter.init", () => new NumericRangeFilter(numericEl, {
          onChange(range) {
            store.setFilter("valorMin", range.min);
            store.setFilter("valorMax", range.max);
            handlers.onFilterChange && handlers.onFilterChange();
          }
        }), { fallback: null });
      }
    }
  }
  if (features.multiSelectFilter !== false) {
    const multiSelectModule = await loadFeature("multiSelectFilter", FeatureModules.multiSelectFilter);
    if (multiSelectModule && multiSelectModule.MultiSelectFilter) {
      const MultiSelectFilter = multiSelectModule.MultiSelectFilter;
      result.multiSelectFilter = initFeature("multiSelectFilter.init", () => new MultiSelectFilter({
        onChange(data) {
          store.setFilter(data.field, data.values.join(","));
          handlers.onFilterChange && handlers.onFilterChange();
        }
      }), { fallback: null });
    }
  }
  if (features.quickFilters !== false) {
    const quickFiltersModule = await loadFeature("quickFilters", FeatureModules.quickFilters);
    if (quickFiltersModule && quickFiltersModule.QuickFiltersManager) {
      const QuickFiltersManager = quickFiltersModule.QuickFiltersManager;
      const quickFiltersEl = ctx.wrapper && ctx.wrapper.querySelector("[data-quick-filters], .p01-quick-filters");
      result.quickFilters = initFeature("quickFilters.init", () => new QuickFiltersManager(quickFiltersEl, {
        onFilter(filter) {
          handlers.onFilterChange && handlers.onFilterChange(filter);
        }
      }), { fallback: null });
    }
  }
  if (features.importPreview !== false) {
    const importPreviewModule = await loadFeature("importPreview", FeatureModules.importPreview);
    if (importPreviewModule && importPreviewModule.ImportPreviewManager) {
      const ImportPreviewManager = importPreviewModule.ImportPreviewManager;
      result.importPreview = initFeature("importPreview.init", () => new ImportPreviewManager({
        onImport(validData) {
          ctx.loadAllData && ctx.loadAllData();
        }
      }), { fallback: null });
    }
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_search_filters_default = { initSearchFilters, info };
export {
  MODULE_ID,
  VERSION,
  init_search_filters_default as default,
  info,
  initSearchFilters
};
