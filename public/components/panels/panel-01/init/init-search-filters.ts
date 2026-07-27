// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-search-filters
// PURPOSE: Panel-01 - Search & Filters Advanced Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   store from ../state/store.js
//   initFeature, loadFeature from ./feature-loader.js
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
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONFIG } from '../core/config.js';
import { store } from '../state/store.js';
import { initFeature, loadFeature } from './feature-loader.js';
import { FeatureModules } from './feature-registry.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:init-search-filters';

export async function initSearchFilters(ctx: Record<string, unknown>, handlers: Record<string, unknown>, result: Record<string, unknown>) {
  const features = CONFIG.features || {};

  // Search Suggestions

  // @ts-expect-error TS migration - TS2339
  if (features.searchSuggestions !== false) {
    const suggestionsModule = await loadFeature('searchSuggestions', FeatureModules.searchSuggestions);
    if (suggestionsModule && (suggestionsModule as Record<string, unknown>).SearchSuggestions) {
      const SearchSuggestions = (suggestionsModule as Record<string, new (...args: unknown[]) => unknown>).SearchSuggestions;
      const searchInput = ctx.wrapper && (ctx.wrapper as HTMLElement).querySelector('[data-search-input], input[type="search"], .p01-search-input');
      if (searchInput) {
        result.searchSuggestions = initFeature('searchSuggestions.init', () => new SearchSuggestions(searchInput, {
          onSelect(item: { text: string }) { handlers.onSearch && (handlers.onSearch as (t: string) => void)(item.text); }
        }), { fallback: null });
      }
    }
  }

  // Search History

  // @ts-expect-error TS migration - TS2339
  if (features.searchHistory !== false) {
    const historyModule = await loadFeature('searchHistory', FeatureModules.searchHistory);
    if (historyModule && (historyModule as Record<string, unknown>).SearchHistory) {
      const SearchHistory = (historyModule as Record<string, new (...args: unknown[]) => unknown>).SearchHistory;
      const searchInput = ctx.wrapper && (ctx.wrapper as HTMLElement).querySelector('[data-search-input], input[type="search"], .p01-search-input');
      if (searchInput) {
        result.searchHistory = initFeature('searchHistory.init', () => new SearchHistory(searchInput, {
          onSelect(term: string) { handlers.onSearch && (handlers.onSearch as (t: string) => void)(term); }
        }), { fallback: null });
      }
    }
  }

  // Filter Presets

  // @ts-expect-error TS migration - TS2339
  if (features.filterPresets !== false) {
    const presetsModule = await loadFeature('filterPresets', FeatureModules.filterPresets);
    if (presetsModule && (presetsModule as Record<string, unknown>).FilterPresetsManager) {
      const FilterPresetsManager = (presetsModule as Record<string, new (...args: unknown[]) => unknown>).FilterPresetsManager;
      result.filterPresets = initFeature('filterPresets.init', () => new FilterPresetsManager({
        onApply(preset: { filters?: Record<string, unknown> }) {
          if (preset.filters) {
            Object.keys(preset.filters).forEach(key => { store.setFilter(key, preset.filters![key]); });
            handlers.onFilterChange && (handlers.onFilterChange as () => void)();
          }
        }
      }), { fallback: null });
    }
  }

  // Date Range Picker

  // @ts-expect-error TS migration - TS2339
  if (features.dateRangePicker !== false) {
    const dateRangeModule = await loadFeature('dateRangePicker', FeatureModules.dateRangePicker);
    if (dateRangeModule && (dateRangeModule as Record<string, unknown>).DateRangePicker) {
      const DateRangePicker = (dateRangeModule as Record<string, new (...args: unknown[]) => unknown>).DateRangePicker;
      const dateRangeEl = ctx.wrapper && (ctx.wrapper as HTMLElement).querySelector('[data-date-range], .p01-date-range');
      if (dateRangeEl) {
        result.dateRangePicker = initFeature('dateRangePicker.init', () => new DateRangePicker(dateRangeEl, {
          onChange(range: { start: unknown; end: unknown }) {
            store.setFilter('dataInicio', range.start);
            store.setFilter('dataFim', range.end);
            handlers.onFilterChange && (handlers.onFilterChange as () => void)();
          }
        }), { fallback: null });
      }
    }
  }

  // Numeric Range Filter

  // @ts-expect-error TS migration - TS2339
  if (features.numericRangeFilter !== false) {
    const numericModule = await loadFeature('numericRangeFilter', FeatureModules.numericRangeFilter);
    if (numericModule && (numericModule as Record<string, unknown>).NumericRangeFilter) {
      const NumericRangeFilter = (numericModule as Record<string, new (...args: unknown[]) => unknown>).NumericRangeFilter;
      const numericEl = ctx.wrapper && (ctx.wrapper as HTMLElement).querySelector('[data-numeric-range], .p01-numeric-range');
      if (numericEl) {
        result.numericRangeFilter = initFeature('numericRangeFilter.init', () => new NumericRangeFilter(numericEl, {
          onChange(range: { min: unknown; max: unknown }) {
            store.setFilter('valorMin', range.min);
            store.setFilter('valorMax', range.max);
            handlers.onFilterChange && (handlers.onFilterChange as () => void)();
          }
        }), { fallback: null });
      }
    }
  }

  // Multi-Select Filter

  // @ts-expect-error TS migration - TS2339
  if (features.multiSelectFilter !== false) {
    const multiSelectModule = await loadFeature('multiSelectFilter', FeatureModules.multiSelectFilter);
    if (multiSelectModule && (multiSelectModule as Record<string, unknown>).MultiSelectFilter) {
      const MultiSelectFilter = (multiSelectModule as Record<string, new (...args: unknown[]) => unknown>).MultiSelectFilter;
      result.multiSelectFilter = initFeature('multiSelectFilter.init', () => new MultiSelectFilter({
        onChange(data: { field: string; values: string[] }) {
          store.setFilter(data.field, data.values.join(','));
          handlers.onFilterChange && (handlers.onFilterChange as () => void)();
        }
      }), { fallback: null });
    }
  }

  // Quick Filters

  // @ts-expect-error TS migration - TS2339
  if (features.quickFilters !== false) {
    const quickFiltersModule = await loadFeature('quickFilters', FeatureModules.quickFilters);
    if (quickFiltersModule && (quickFiltersModule as Record<string, unknown>).QuickFiltersManager) {
      const QuickFiltersManager = (quickFiltersModule as Record<string, new (...args: unknown[]) => unknown>).QuickFiltersManager;
      const quickFiltersEl = ctx.wrapper && (ctx.wrapper as HTMLElement).querySelector('[data-quick-filters], .p01-quick-filters');
      (result as Record<string, unknown>).quickFilters = initFeature('quickFilters.init', () => new QuickFiltersManager(quickFiltersEl, {
        onFilter(filter: unknown) { handlers.onFilterChange && (handlers.onFilterChange as (f: unknown) => void)(filter); }
      }), { fallback: null });
    }
  }

  // Import Preview

  // @ts-expect-error TS migration - TS2339
  if (features.importPreview !== false) {
    const importPreviewModule = await loadFeature('importPreview', FeatureModules.importPreview);
    if (importPreviewModule && (importPreviewModule as Record<string, unknown>).ImportPreviewManager) {
      const ImportPreviewManager = (importPreviewModule as Record<string, new (...args: unknown[]) => unknown>).ImportPreviewManager;
      result.importPreview = initFeature('importPreview.init', () => new ImportPreviewManager({
        onImport(validData: unknown) { ctx.loadAllData && (ctx.loadAllData as () => void)(); }
      }), { fallback: null });
    }
  }

  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initSearchFilters, info };
