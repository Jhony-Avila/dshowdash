import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isEnabled } from "../../config/feature-flags.js";
import { DateRangeFilter } from "./date-range.js";
import { MultiSelectFilter } from "./multi-select.js";
import { QuickFilters } from "./quick-filters.js";
import { FilterPresets } from "./filter-presets.js";
const VERSION = "10.2.0-MIGRATION-PHASE4";
const MODULE_ID = "panel-nav-admin.ui.filters";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[FiltersOrchestrator]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
function FiltersOrchestrator(options = {}) {
  const container = options.container;
  const onFilterChange = options.onFilterChange;
  const getItems = options.getItems;
  const _filters = {};
  let _el = null;
  let _isExpanded = false;
  function init() {
    if (!container) return;
    _el = document.createElement("div");
    _el.className = "pna-filters-advanced";
    _el.innerHTML = `
      <div class="pna-filters-advanced__toggle">
        <button type="button" class="pna-filters-advanced__btn" data-action="toggle-advanced-filters">
          Filtros Avan\xE7ados
        </button>
      </div>
      <div class="pna-filters-advanced__panel" style="display:none">
        <div class="pna-filters-advanced__quick" data-slot="quick"></div>
        <div class="pna-filters-advanced__grid" data-slot="grid"></div>
        <div class="pna-filters-advanced__presets" data-slot="presets"></div>
      </div>
    `;
    container.appendChild(_el);
    _el.querySelector('[data-action="toggle-advanced-filters"]')?.addEventListener("click", _togglePanel);
    const quickSlot = _el.querySelector('[data-slot="quick"]');
    const gridSlot = _el.querySelector('[data-slot="grid"]');
    const presetsSlot = _el.querySelector('[data-slot="presets"]');
    if (isEnabled("quickFilters")) {
      _filters.quick = QuickFilters({
        container: quickSlot,
        onChange: () => _handleChange()
      });
      _filters.quick.render();
    }
    if (isEnabled("dateRangeFilter")) {
      _filters.dateRange = DateRangeFilter({
        container: gridSlot,
        onChange: () => _handleChange(),
        field: "createdAt"
      });
      _filters.dateRange.render();
    }
    if (isEnabled("multiSelectFilter")) {
      _filters.context = MultiSelectFilter({
        container: gridSlot,
        dimension: "context",
        onChange: () => _handleChange()
      });
      _filters.context.render();
      _filters.status = MultiSelectFilter({
        container: gridSlot,
        dimension: "status",
        onChange: () => _handleChange()
      });
      _filters.status.render();
      _filters.permissionLevel = MultiSelectFilter({
        container: gridSlot,
        dimension: "permissionLevel",
        onChange: () => _handleChange()
      });
      _filters.permissionLevel.render();
    }
    if (isEnabled("filterPresets")) {
      _filters.presets = FilterPresets({
        container: presetsSlot,
        onApply: (config) => _applyPresetConfig(config),
        getCurrentConfig: () => getFilterState()
      });
      _filters.presets.render();
    }
    _log("info", "Initialized with", Object.keys(_filters).length, "sub-filters");
  }
  function _togglePanel() {
    _isExpanded = !_isExpanded;
    const panel = _el?.querySelector(".pna-filters-advanced__panel");
    if (panel) {
      panel.style.display = _isExpanded ? "block" : "none";
    }
    const btn = _el?.querySelector('[data-action="toggle-advanced-filters"]');
    if (btn) {
      btn.classList.toggle("pna-filters-advanced__btn--active", _isExpanded);
    }
  }
  function _handleChange() {
    if (typeof onFilterChange === "function") {
      onFilterChange();
    }
  }
  function _applyPresetConfig(config) {
    if (!config) return;
    if (config.dateRange && _filters.dateRange) {
      _filters.dateRange.setValues?.(config.dateRange);
    }
    if (config.quick && _filters.quick) {
      _filters.quick.setValues?.(config.quick);
    }
    if (config.context && _filters.context) {
      _filters.context.setValues?.(config.context);
    }
    if (config.status && _filters.status) {
      _filters.status.setValues?.(config.status);
    }
    if (config.permissionLevel && _filters.permissionLevel) {
      _filters.permissionLevel.setValues?.(config.permissionLevel);
    }
    _handleChange();
  }
  function applyAll(items) {
    let result = items;
    for (const filter of Object.values(_filters)) {
      if (typeof filter.apply === "function" && filter.isActive?.()) {
        result = filter.apply(result);
      }
    }
    return result;
  }
  function getFilterState() {
    const state = {};
    if (_filters.dateRange?.isActive?.()) state.dateRange = _filters.dateRange.getValues?.();
    if (_filters.quick?.isActive?.()) state.quick = _filters.quick.getValues?.();
    if (_filters.context?.isActive?.()) state.context = _filters.context.getValues?.();
    if (_filters.status?.isActive?.()) state.status = _filters.status.getValues?.();
    if (_filters.permissionLevel?.isActive?.()) state.permissionLevel = _filters.permissionLevel.getValues?.();
    return state;
  }
  function hasActiveFilters() {
    return Object.values(_filters).some((f) => f.isActive?.());
  }
  function getActiveCount() {
    return Object.values(_filters).filter((f) => f.isActive?.()).length;
  }
  function clearAll() {
    for (const filter of Object.values(_filters)) {
      if (typeof filter.clear === "function") filter.clear();
    }
    _handleChange();
  }
  function updateSectionOptions(sectionOptions) {
    if (_filters.section) {
      _filters.section.updateOptions?.(sectionOptions);
    }
  }
  function destroy() {
    for (const filter of Object.values(_filters)) {
      if (typeof filter.destroy === "function") filter.destroy();
    }
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el = null;
  }
  return {
    init,
    applyAll,
    getFilterState,
    hasActiveFilters,
    getActiveCount,
    clearAll,
    updateSectionOptions,
    destroy
  };
}
import { DateRangeFilter as DateRangeFilter2 } from "./date-range.js";
import { MultiSelectFilter as MultiSelectFilter2, DIMENSIONS as DIMENSIONS2 } from "./multi-select.js";
import { QuickFilters as QuickFilters2 } from "./quick-filters.js";
import { FilterPresets as FilterPresets2 } from "./filter-presets.js";
function info() {
  return { moduleId: MODULE_ID, version: VERSION, subModules: ["date-range", "multi-select", "quick-filters", "filter-presets"] };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var filters_default = { FiltersOrchestrator, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  DIMENSIONS2 as DIMENSIONS,
  DateRangeFilter2 as DateRangeFilter,
  FilterPresets2 as FilterPresets,
  FiltersOrchestrator,
  MODULE_ID,
  MultiSelectFilter2 as MultiSelectFilter,
  QuickFilters2 as QuickFilters,
  VERSION,
  filters_default as default,
  healthCheck,
  info,
  injectPorts
};
