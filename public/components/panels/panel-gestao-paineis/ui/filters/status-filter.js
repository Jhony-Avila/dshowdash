import { CSS_PREFIX } from "../../core/constants.js";
const STATUS_LABELS = {
  all: "Todos",
  active: "Ativos",
  inactive: "Inativos"
};
const CHEVRON_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
function renderStatusFilter(selected) {
  const label = STATUS_LABELS[selected] || "Todos";
  return `
    <button type="button" class="${CSS_PREFIX}-status-filter pgp-cs-trigger" data-action="open-status-select" data-current-value="${selected}">
      <span class="${CSS_PREFIX}-status-filter__label">${label}</span>
      <span class="${CSS_PREFIX}-status-filter__chevron">${CHEVRON_SVG}</span>
    </button>`;
}
export {
  renderStatusFilter
};
