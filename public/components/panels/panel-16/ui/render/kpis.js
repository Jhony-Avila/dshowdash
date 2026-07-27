const MODULE_ID = "panel-16.ui.render.kpis";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderKPIs(container, kpis = []) {
  const html = `
        <div class="kpis-container">
            ${kpis.map((kpi) => `
                <div class="kpi-card ${kpi.highlight ? "kpi-highlight" : ""}">
                    <div class="kpi-icon"><i class="fas ${kpi.icon || "fa-chart-line"}"></i></div>
                    <div class="kpi-content">
                        <div class="kpi-label">${kpi.label}</div>
                        <div class="kpi-value">${kpi.value}</div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
  if (container instanceof HTMLElement) {
    container.innerHTML = html;
  }
  return html;
}
function renderQuickStats(kpis, displayCount, totalCount, searchTerm, favorites) {
  const filteredLabel = searchTerm ? ` (filtrado de ${totalCount})` : "";
  return `
        <div class="p16-quick-stats">
            <span class="p16-qs-count">${displayCount} fornecedores${filteredLabel}</span>
        </div>
    `;
}
function renderDistributions(kpis) {
  return `<div class="p16-distributions-content">${kpis ? "Distribui\xE7\xF5es carregadas" : ""}</div>`;
}
function renderLoading(section) {
  return `<div class="p16-loading p16-loading-${section}"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>`;
}
var kpis_default = { renderKPIs, renderQuickStats, renderDistributions, renderLoading };
export {
  MODULE_ID,
  VERSION,
  kpis_default as default,
  renderDistributions,
  renderKPIs,
  renderLoading,
  renderQuickStats
};
