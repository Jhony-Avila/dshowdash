import { CSS_PREFIX, SEARCH_DEBOUNCE_MS } from "../../core/constants.js";
function renderSearchInput(value) {
  const icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  return `
    <div class="${CSS_PREFIX}-search">
      <span class="${CSS_PREFIX}-search__icon">${icon}</span>
      <input type="text"
        class="${CSS_PREFIX}-search-input"
        placeholder="Buscar painel..."
        value="${value.replace(/"/g, "&quot;")}"
        data-action="search"
      />
    </div>`;
}
function createSearchDebounce(callback) {
  let timer = null;
  return (value) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => callback(value), SEARCH_DEBOUNCE_MS);
  };
}
export {
  createSearchDebounce,
  renderSearchInput
};
