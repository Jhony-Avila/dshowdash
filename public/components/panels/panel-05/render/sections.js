import { updateKPIs } from "../renderer/kpis.js";
import { chartsRenderer } from "../ui/charts.js";
import { insightsRenderer } from "../ui/insights.js";
import { funilRenderer } from "../ui/funil.js";
import { advancedRenderer } from "../ui/advanced.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:render:sections";
function renderKPIs(refs, data) {
  if (!refs || !data) return;
  updateKPIs(refs, data);
}
function renderCharts(refs, data) {
  if (!refs?.chartsArea || !data) return;
  const chartsArea = refs.chartsArea;
  let html = '<div class="p05-charts-grid">';
  const receitaMensal = data.receitaMensal;
  const topClientes = data.topClientes;
  const porUF = data.porUF;
  const vendedores = data.vendedores;
  if (receitaMensal?.length) {
    html += `<div class="p05-chart-card">${chartsRenderer.renderReceitaMensal(receitaMensal)}</div>`;
  }
  if (topClientes?.length) {
    html += `<div class="p05-chart-card">${chartsRenderer.renderTopClientes(topClientes)}</div>`;
  }
  if (porUF?.length) {
    html += `<div class="p05-chart-card">${chartsRenderer.renderPorUF(porUF)}</div>`;
  }
  if (vendedores?.length) {
    html += `<div class="p05-chart-card">${chartsRenderer.renderVendedores(vendedores)}</div>`;
  }
  html += "</div>";
  chartsArea.innerHTML = html;
  chartsArea.style.display = receitaMensal?.length || topClientes?.length ? "" : "none";
}
function renderInsights(refs, data) {
  const dataArr = data;
  if (!refs?.chartsArea || !dataArr?.length) return;
  const chartsArea = refs.chartsArea;
  const container = chartsArea.querySelector(".p05-insights-container") || document.createElement("div");
  container.className = "p05-insights-container";
  container.innerHTML = insightsRenderer.renderInsightsPanel(dataArr);
  if (!chartsArea.contains(container)) {
    chartsArea.appendChild(container);
  }
}
function renderComparativo(refs, data) {
  if (!refs?.chartsArea || !data) return;
  const chartsArea = refs.chartsArea;
  const container = chartsArea.querySelector(".p05-comparativo-container") || document.createElement("div");
  container.className = "p05-comparativo-container";
  container.innerHTML = insightsRenderer.renderComparativo(data);
  if (!chartsArea.contains(container)) {
    chartsArea.appendChild(container);
  }
}
function renderFunil(refs, data) {
  if (!refs?.chartsArea || !data) return;
  const chartsArea = refs.chartsArea;
  const container = chartsArea.querySelector(".p05-funil-container") || document.createElement("div");
  container.className = "p05-funil-container";
  let html = "";
  const stages = data.stages;
  const motivosPerda = data.motivosPerda;
  if (stages?.length) {
    html += funilRenderer.renderFunil(stages);
  }
  if (motivosPerda?.length) {
    html += funilRenderer.renderMotivosPerda(motivosPerda);
  }
  if (data.metricas) {
    html += funilRenderer.renderMetricasAvancadas(data.metricas);
  }
  container.innerHTML = html;
  if (!chartsArea.contains(container)) {
    chartsArea.appendChild(container);
  }
}
function renderChurn(refs, data) {
  const dataArr = data;
  if (!refs?.chartsArea || !dataArr?.length) return;
  const chartsArea = refs.chartsArea;
  const container = chartsArea.querySelector(".p05-churn-container") || document.createElement("div");
  container.className = "p05-churn-container";
  container.innerHTML = advancedRenderer.renderChurnRisk(dataArr);
  if (!chartsArea.contains(container)) {
    chartsArea.appendChild(container);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var sections_default = { renderKPIs, renderCharts, renderInsights, renderComparativo, renderFunil, renderChurn, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  sections_default as default,
  info,
  renderCharts,
  renderChurn,
  renderComparativo,
  renderFunil,
  renderInsights,
  renderKPIs
};
