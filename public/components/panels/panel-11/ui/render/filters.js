import { ICONS } from "../../core/constants.js";
const PERIODS = [
  { value: "7d", label: "7 dias" },
  { value: "15d", label: "15 dias" },
  { value: "30d", label: "30 dias" },
  { value: "60d", label: "60 dias" }
];
function renderFilters(filters) {
  return `
    <div class="p11-filters">
      <span class="p11-filters-label">Filtros:</span>
      
      <div class="p11-period-selector">
        ${PERIODS.map((p) => `
          <button class="p11-period-btn ${filters.period === p.value ? "active" : ""}" 
                  data-period="${p.value}" type="button">
            ${p.label}
          </button>
        `).join("")}
      </div>
      
      <div class="p11-filter-chips">
        <button class="p11-filter-chip ${!filters.status ? "active" : ""}" data-filter="status" data-value="" type="button">
          ${ICONS.activity} Todos
        </button>
        <button class="p11-filter-chip ${filters.status === "success" ? "active" : ""}" data-filter="status" data-value="success" type="button">
          ${ICONS.check} Sucesso
        </button>
        <button class="p11-filter-chip ${filters.status === "error" ? "active" : ""}" data-filter="status" data-value="error" type="button">
          ${ICONS.x} Erros
        </button>
      </div>
      
      <div class="p11-search">
        <span class="p11-search-icon">${ICONS.search || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`}</span>
        <input type="text" class="p11-search-input" placeholder="Buscar job..." data-search aria-label="Buscar job">
      </div>
    </div>
  `;
}
var filters_default = { renderFilters };
const MODULE_ID = "panels-ui-render-filters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  filters_default as default,
  healthCheck,
  info,
  renderFilters
};
