// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:render:sections
// PURPOSE: Panel-05 - Section Renderers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   updateKPIs from ../renderer/kpis.js
//   chartsRenderer from ../ui/charts.js
//   insightsRenderer from ../ui/insights.js
//   funilRenderer from ../ui/funil.js
//   advancedRenderer from ../ui/advanced.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderKPIs() — exported function
//   renderCharts() — exported function
//   renderInsights() — exported function
//   renderComparativo() — exported function
//   renderFunil() — exported function
//   renderChurn() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { updateKPIs } from '../renderer/kpis.js';
import { chartsRenderer } from '../ui/charts.js';
import { insightsRenderer } from '../ui/insights.js';
import { funilRenderer } from '../ui/funil.js';
import { advancedRenderer } from '../ui/advanced.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:render:sections';

export function renderKPIs(refs: Record<string, unknown> | null, data: unknown) {
  if (!refs || !data) return;
  updateKPIs(refs, data as Record<string, unknown>);
}

export function renderCharts(refs: Record<string, unknown> | null, data: Record<string, unknown> | null) {
  if (!refs?.chartsArea || !data) return;
  const chartsArea = refs.chartsArea as HTMLElement;

  let html = '<div class="p05-charts-grid">';

  const receitaMensal = data.receitaMensal as Array<Record<string, unknown>> | null;
  const topClientes = data.topClientes as Array<Record<string, unknown>> | null;
  const porUF = data.porUF as Array<Record<string, unknown>> | null;
  const vendedores = data.vendedores as Array<Record<string, unknown>> | null;

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

  html += '</div>';

  chartsArea.innerHTML = html;
  chartsArea.style.display = receitaMensal?.length || topClientes?.length ? '' : 'none';
}

export function renderInsights(refs: Record<string, unknown> | null, data: unknown) {
  const dataArr = data as Array<Record<string, unknown>> | null;
  if (!refs?.chartsArea || !dataArr?.length) return;
  const chartsArea = refs.chartsArea as HTMLElement;

  const container = (chartsArea.querySelector('.p05-insights-container') || document.createElement('div')) as HTMLElement;
  container.className = 'p05-insights-container';
  container.innerHTML = insightsRenderer.renderInsightsPanel(dataArr);

  if (!chartsArea.contains(container)) {
    chartsArea.appendChild(container);
  }
}

export function renderComparativo(refs: Record<string, unknown> | null, data: unknown) {
  if (!refs?.chartsArea || !data) return;
  const chartsArea = refs.chartsArea as HTMLElement;

  const container = (chartsArea.querySelector('.p05-comparativo-container') || document.createElement('div')) as HTMLElement;
  container.className = 'p05-comparativo-container';
  container.innerHTML = insightsRenderer.renderComparativo(data);

  if (!chartsArea.contains(container)) {
    chartsArea.appendChild(container);
  }
}

export function renderFunil(refs: Record<string, unknown> | null, data: Record<string, unknown> | null) {
  if (!refs?.chartsArea || !data) return;
  const chartsArea = refs.chartsArea as HTMLElement;

  const container = (chartsArea.querySelector('.p05-funil-container') || document.createElement('div')) as HTMLElement;
  container.className = 'p05-funil-container';

  let html = '';
  const stages = data.stages as Array<Record<string, unknown>> | null;
  const motivosPerda = data.motivosPerda as Array<Record<string, unknown>> | null;
  if (stages?.length) {
    html += funilRenderer.renderFunil(stages);
  }
  if (motivosPerda?.length) {
    html += funilRenderer.renderMotivosPerda(motivosPerda);
  }
  if (data.metricas) {
    html += funilRenderer.renderMetricasAvancadas(data.metricas as Record<string, unknown>);
  }

  container.innerHTML = html;

  if (!chartsArea.contains(container)) {
    chartsArea.appendChild(container);
  }
}

export function renderChurn(refs: Record<string, unknown> | null, data: unknown) {
  const dataArr = data as Array<Record<string, unknown>> | null;
  if (!refs?.chartsArea || !dataArr?.length) return;
  const chartsArea = refs.chartsArea as HTMLElement;

  const container = (chartsArea.querySelector('.p05-churn-container') || document.createElement('div')) as HTMLElement;
  container.className = 'p05-churn-container';
  container.innerHTML = advancedRenderer.renderChurnRisk(dataArr);

  if (!chartsArea.contains(container)) {
    chartsArea.appendChild(container);
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export default { renderKPIs, renderCharts, renderInsights, renderComparativo, renderFunil, renderChurn, info, VERSION, MODULE_ID };
