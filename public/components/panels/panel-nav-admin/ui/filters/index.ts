// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE4)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.filters
// PURPOSE: Filters Orchestrator — Coordena todos os filtros avançados
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isEnabled from ../../config/feature-flags.js
//   DateRangeFilter from ./date-range.js
//   MultiSelectFilter, DIMENSIONS from ./multi-select.js
//   QuickFilters from ./quick-filters.js
//   FilterPresets from ./filter-presets.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   FiltersOrchestrator — Factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/filters.js orchestrator pattern
// @changelog
//   10.2.0-MIGRATION-PHASE4: Initial creation — FASE 4 B.9
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isEnabled } from '../../config/feature-flags.js';
import { DateRangeFilter } from './date-range.js';
import { MultiSelectFilter, DIMENSIONS } from './multi-select.js';
import { QuickFilters } from './quick-filters.js';
import { FilterPresets } from './filter-presets.js';

export const VERSION = '10.2.0-MIGRATION-PHASE4';
export const MODULE_ID = 'panel-nav-admin.ui.filters';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[FiltersOrchestrator]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Factory: creates a unified filters orchestrator for nav-admin.
 * Coordinates date range, multi-select, quick filters, and presets.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container — Parent DOM element for all filters
 * @param {Function} options.onFilterChange — Callback() when any filter changes
 * @param {Function} [options.getItems] — Returns current items array for filtering
 * @returns {Object} FiltersOrchestrator instance
 */
interface FilterInstance {
  render(): void;
  apply?(items: unknown[]): unknown[];
  isActive?(): boolean;
  getValues?(): Record<string, any>;
  setValues?(values: Record<string, any>): void;
  clear?(): void;
  updateOptions?(options: unknown[]): void;
  destroy?(): void;
}

interface FiltersMap {
  quick?: FilterInstance;
  dateRange?: FilterInstance;
  context?: FilterInstance;
  status?: FilterInstance;
  permissionLevel?: FilterInstance;
  presets?: FilterInstance;
  section?: FilterInstance;
  [key: string]: FilterInstance | undefined;
}

export function FiltersOrchestrator(options: Record<string, unknown> = {}) {
  const container = options.container as HTMLElement | undefined;
  const onFilterChange = options.onFilterChange as (() => void) | undefined;
  const getItems = options.getItems as (() => unknown[]) | undefined;

  /** @private Active sub-filter instances */
  const _filters: FiltersMap = {};
  let _el: HTMLElement | null = null;
  let _isExpanded = false;

  /**
   * Initialize and render all enabled filter sub-modules.
   */
  function init() {
    if (!container) return;

    _el = document.createElement('div');
    _el.className = 'pna-filters-advanced';
    _el.innerHTML = `
      <div class="pna-filters-advanced__toggle">
        <button type="button" class="pna-filters-advanced__btn" data-action="toggle-advanced-filters">
          Filtros Avançados
        </button>
      </div>
      <div class="pna-filters-advanced__panel" style="display:none">
        <div class="pna-filters-advanced__quick" data-slot="quick"></div>
        <div class="pna-filters-advanced__grid" data-slot="grid"></div>
        <div class="pna-filters-advanced__presets" data-slot="presets"></div>
      </div>
    `;
    container.appendChild(_el);

    _el.querySelector('[data-action="toggle-advanced-filters"]')
      ?.addEventListener('click', _togglePanel);

    const quickSlot = _el.querySelector('[data-slot="quick"]');
    const gridSlot = _el.querySelector('[data-slot="grid"]');
    const presetsSlot = _el.querySelector('[data-slot="presets"]');

    // Quick Filters
    if (isEnabled('quickFilters')) {

      _filters.quick = QuickFilters({
        container: quickSlot,
        onChange: () => _handleChange()
      });

      _filters.quick.render();
    }

    // Date Range Filter
    if (isEnabled('dateRangeFilter')) {

      // @ts-expect-error strict migration — TS2322
      _filters.dateRange = DateRangeFilter({
        container: gridSlot,
        onChange: () => _handleChange(),
        field: 'createdAt'
      });

      // @ts-expect-error strict migration — TS18048
      _filters.dateRange.render();
    }

    // Multi-Select Filters (context, status, permission level)
    if (isEnabled('multiSelectFilter')) {

      _filters.context = MultiSelectFilter({
        container: gridSlot,
        dimension: 'context',
        onChange: () => _handleChange()
      });

      _filters.context.render();


      _filters.status = MultiSelectFilter({
        container: gridSlot,
        dimension: 'status',
        onChange: () => _handleChange()
      });

      _filters.status.render();


      _filters.permissionLevel = MultiSelectFilter({
        container: gridSlot,
        dimension: 'permissionLevel',
        onChange: () => _handleChange()
      });

      _filters.permissionLevel.render();
    }

    // Filter Presets
    if (isEnabled('filterPresets')) {

      _filters.presets = FilterPresets({
        container: presetsSlot,
        onApply: (config: Record<string, unknown>) => _applyPresetConfig(config),
        getCurrentConfig: () => getFilterState()
      });

      _filters.presets.render();
    }

    _log('info', 'Initialized with', Object.keys(_filters).length, 'sub-filters');
  }

  /** @private */
  function _togglePanel() {
    _isExpanded = !_isExpanded;
    const panel = _el?.querySelector('.pna-filters-advanced__panel');
    if (panel) {
      (panel as HTMLElement).style.display = _isExpanded ? 'block' : 'none';
    }
    const btn = _el?.querySelector('[data-action="toggle-advanced-filters"]');
    if (btn) {
      btn.classList.toggle('pna-filters-advanced__btn--active', _isExpanded);
    }
  }

  /** @private */
  function _handleChange() {
    if (typeof onFilterChange === 'function') {
      onFilterChange();
    }
  }

  /**
   * Apply preset config to all sub-filters.
   * @private
   * @param {Object} config
   */
  function _applyPresetConfig(config: Record<string, unknown>) {
    if (!config) return;


    if (config.dateRange && _filters.dateRange) {

      _filters.dateRange.setValues?.(config.dateRange as Record<string, unknown>);
    }

    if (config.quick && _filters.quick) {

      _filters.quick.setValues?.(config.quick as Record<string, unknown>);
    }

    if (config.context && _filters.context) {

      _filters.context.setValues?.(config.context as Record<string, unknown>);
    }

    if (config.status && _filters.status) {

      _filters.status.setValues?.(config.status as Record<string, unknown>);
    }

    if (config.permissionLevel && _filters.permissionLevel) {

      _filters.permissionLevel.setValues?.(config.permissionLevel as Record<string, unknown>);
    }

    _handleChange();
  }

  /**
   * Apply all active filters to an array of items.
   * Filters are chained (AND logic between filter types).
   * @param {Array} items
   * @returns {Array} Filtered items
   */
  function applyAll(items: unknown[]) {
    let result = items;
    for (const filter of Object.values(_filters)) {

      if (typeof filter!.apply === 'function' && filter!.isActive?.()) {

        result = filter!.apply(result);
      }
    }
    return result;
  }

  /**
   * Get the current state of all filters for serialization.
   * @returns {Object}
   */
  function getFilterState() {
    const state: Record<string, unknown> = {};

    if (_filters.dateRange?.isActive?.()) state.dateRange = _filters.dateRange.getValues?.();

    if (_filters.quick?.isActive?.()) state.quick = _filters.quick.getValues?.();

    if (_filters.context?.isActive?.()) state.context = _filters.context.getValues?.();

    if (_filters.status?.isActive?.()) state.status = _filters.status.getValues?.();

    if (_filters.permissionLevel?.isActive?.()) state.permissionLevel = _filters.permissionLevel.getValues?.();
    return state;
  }

  /**
   * Check if any filter is active.
   * @returns {boolean}
   */
  function hasActiveFilters() {

    return Object.values(_filters).some(f => f!.isActive?.());
  }

  /**
   * Get count of active filter types.
   * @returns {number}
   */
  function getActiveCount() {

    return Object.values(_filters).filter(f => f!.isActive?.()).length;
  }

  /**
   * Clear all filters.
   */
  function clearAll() {
    for (const filter of Object.values(_filters)) {

      if (typeof filter!.clear === 'function') filter!.clear();
    }
    _handleChange();
  }

  /**
   * Update section options for multi-select section filter.
   * @param {Array<{value: string, label: string}>} sectionOptions
   */
  function updateSectionOptions(sectionOptions: { value: string; label: string }[]) {

    if (_filters.section) {

      _filters.section.updateOptions?.(sectionOptions);
    }
  }

  /** Destroy all sub-filters and DOM. */
  function destroy() {
    for (const filter of Object.values(_filters)) {

      if (typeof filter!.destroy === 'function') filter!.destroy();
    }
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el = null;
  }

  return {
    init, applyAll, getFilterState, hasActiveFilters, getActiveCount,
    clearAll, updateSectionOptions, destroy
  };
}

// Re-export sub-modules
export { DateRangeFilter } from './date-range.js';
export { MultiSelectFilter, DIMENSIONS } from './multi-select.js';
export { QuickFilters } from './quick-filters.js';
export { FilterPresets } from './filter-presets.js';

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, subModules: ['date-range', 'multi-select', 'quick-filters', 'filter-presets'] };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { FiltersOrchestrator, injectPorts, info, healthCheck, VERSION, MODULE_ID };
