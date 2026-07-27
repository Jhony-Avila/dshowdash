const MODULE_ID = "panel-16.ui.render.filterbar";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderFilterBar(container, { filters = [], onFilterChange }) {
  const html = `
        <div class="filter-bar">
            <div class="filter-bar-content">
                ${filters.map((f) => `
                    <div class="filter-item" data-key="${f.key}">
                        <label>${f.label}</label>
                        <select class="filter-select">
                            <option value="">Todos</option>
                            ${f.options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}
                        </select>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
  container.innerHTML = html;
  container.querySelectorAll(".filter-select").forEach((select) => {
    select.addEventListener("change", () => {
      const key = select.closest(".filter-item")?.getAttribute("data-key") ?? "";
      if (typeof onFilterChange === "function") {
        onFilterChange(key, select.value);
      }
    });
  });
}
function renderFilterChips(filters, sortColumns, clientSearchTerm) {
  const chips = [];
  if (clientSearchTerm) chips.push(`<span class="p16-chip">Busca: ${clientSearchTerm}</span>`);
  if (filters.status) chips.push(`<span class="p16-chip">Status: ${filters.status}</span>`);
  if (filters.tipo) chips.push(`<span class="p16-chip">Tipo: ${filters.tipo}</span>`);
  if (filters.uf) chips.push(`<span class="p16-chip">UF: ${filters.uf}</span>`);
  if (sortColumns && sortColumns.length > 0) {
    sortColumns.forEach((sc) => chips.push(`<span class="p16-chip">Ord: ${sc.key}</span>`));
  }
  return chips.length > 0 ? `<div class="p16-filter-chips">${chips.join("")}</div>` : "";
}
function renderFilters(state) {
  return `<div class="p16-filters-content">Filtros (${state.displayDataLength || 0} resultados)</div>`;
}
var filterbar_default = { renderFilterBar, renderFilterChips, renderFilters };
export {
  MODULE_ID,
  VERSION,
  filterbar_default as default,
  renderFilterBar,
  renderFilterChips,
  renderFilters
};
