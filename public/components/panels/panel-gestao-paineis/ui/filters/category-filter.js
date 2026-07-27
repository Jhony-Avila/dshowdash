import { CSS_PREFIX } from "../../core/constants.js";
const CHEVRON_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
function renderCategoryFilter(categories, selected) {
  const label = selected ? categories.find((c) => c.category === selected)?.category || selected : "Todas categorias";
  return `
    <button type="button" class="${CSS_PREFIX}-category-filter pgp-cs-trigger" data-action="open-category-select" data-current-value="${selected || ""}">
      <span class="${CSS_PREFIX}-category-filter__label">${label}</span>
      <span class="${CSS_PREFIX}-category-filter__chevron">${CHEVRON_SVG}</span>
    </button>`;
}
export {
  renderCategoryFilter
};
