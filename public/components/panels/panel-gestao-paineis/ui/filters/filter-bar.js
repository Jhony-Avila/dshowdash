import { CSS_PREFIX } from "../../core/constants.js";
import { renderSearchInput } from "./search-input.js";
import { renderCategoryFilter } from "./category-filter.js";
import { renderStatusFilter } from "./status-filter.js";
import { hasActiveFilters } from "../../state/filters.js";
const SORT_STORAGE_KEY = "pgp-sort-preference";
function getSavedSort() {
  try {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.field && parsed.order) return parsed;
    }
  } catch (_) {
  }
  return { field: "title", order: "asc" };
}
function saveSort(config) {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(config));
  } catch (_) {
  }
}
const SORT_OPTIONS = [
  { field: "title", label: "Nome (A-Z)" },
  { field: "category", label: "Categoria" },
  { field: "last_screenshot_at", label: "Screenshot" },
  { field: "is_active", label: "Status" }
];
function renderSortButton(currentSort) {
  const current = SORT_OPTIONS.find((o) => o.field === currentSort.field);
  const label = current ? current.label : "Ordenar";
  const chevron = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  const sortIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="16" y2="6"/><line x1="4" y1="12" x2="12" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/><polyline points="15 15 18 18 21 15"/><line x1="18" y1="8" x2="18" y2="18"/></svg>`;
  const orderArrow = currentSort.order === "asc" ? "\u2191" : "\u2193";
  return `<button class="${CSS_PREFIX}-sort-trigger ${CSS_PREFIX}-cs-trigger" data-action="open-sort-select" title="Ordenar por">
    ${sortIcon}
    <span class="${CSS_PREFIX}-sort-trigger__label">${label} ${orderArrow}</span>
    ${chevron}
  </button>`;
}
function renderFilterBar(filters, categories, totalFiltered) {
  const showClear = hasActiveFilters(filters);
  const clearBtn = showClear ? `<button class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--clear" data-action="clear-filters">Limpar filtros</button>` : "";
  const exportBtn = `<button class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--export" data-action="export-panels" title="Exportar JSON">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Exportar
  </button>`;
  const currentSort = getSavedSort();
  return `
    <div class="${CSS_PREFIX}-filter-bar">
      ${renderSearchInput(filters.search)}
      ${renderCategoryFilter(categories, filters.category)}
      ${renderStatusFilter(filters.status)}
      ${renderSortButton(currentSort)}
      <span class="${CSS_PREFIX}-filter-count">${totalFiltered} pain\xE9is</span>
      ${clearBtn}
      ${exportBtn}
    </div>`;
}
export {
  getSavedSort,
  renderFilterBar,
  saveSort
};
