import { SLA_TARGET } from "../../core/constants.js";
import { calculateAvgRate } from "../helpers.js";
function renderTrendChart(data, filters) {
  const trend = data.trend_30_days || [];
  const avgRate = calculateAvgRate(trend);
  const lastTrend = trend.length > 0 ? trend[trend.length - 1] : null;
  const currentRate = lastTrend ? parseFloat(lastTrend.success_rate) || 0 : 0;
  const metSla = avgRate >= SLA_TARGET;
  return `
    <div class="p11-chart-card" style="margin:0 16px;">
      <div class="p11-chart-header">
        <div>
          <div class="p11-chart-title">Tend\xEAncia de Performance (${filters.period})</div>
          <div class="p11-chart-subtitle">Taxa de sucesso ao longo do per\xEDodo</div>
        </div>
        <div class="p11-chart-stats">
          <div class="p11-chart-stat">
            <div class="p11-chart-stat-label">Atual</div>
            <div class="p11-chart-stat-value">${currentRate.toFixed(1)}%</div>
          </div>
          <div class="p11-chart-stat">
            <div class="p11-chart-stat-label">M\xE9dia</div>
            <div class="p11-chart-stat-value">${avgRate.toFixed(1)}%</div>
          </div>
          <div class="p11-chart-stat">
            <div class="p11-chart-stat-label">SLA (${SLA_TARGET}%)</div>
            <span class="p11-badge ${metSla ? "p11-badge--ok" : "p11-badge--error"}">${metSla ? "Atingido" : "Abaixo"}</span>
          </div>
        </div>
      </div>
      ${renderTrendSVG(trend)}
      <div class="p11-chart-legend">
        <span class="p11-chart-legend-item"><span class="p11-chart-legend-dot p11-chart-legend-dot--total"></span> Total</span>
        <span class="p11-chart-legend-item"><span class="p11-chart-legend-dot p11-chart-legend-dot--success"></span> Sucesso</span>
        <span class="p11-chart-legend-item"><span class="p11-chart-legend-dot p11-chart-legend-dot--error"></span> Erro</span>
        <span class="p11-chart-legend-item"><span class="p11-chart-legend-dot p11-chart-legend-dot--sla"></span> SLA ${SLA_TARGET}%</span>
      </div>
    </div>
  `;
}
function renderTrendSVG(trend) {
  if (!trend.length) return '<div style="height:120px;display:flex;align-items:center;justify-content:center;color:var(--p11-text-muted);">Sem dados de tend\xEAncia</div>';
  const maxTotal = Math.max(...trend.map((t) => parseInt(t.total) || 0), 1);
  const padding = 5;
  const chartHeight = 100;
  const slaY = chartHeight - padding - SLA_TARGET / 100 * (chartHeight - padding * 2);
  const createLine = (data, color, key, isRate = false) => {
    const points = data.map((t, i) => {
      const x = padding + i / (data.length - 1) * (100 - padding * 2);
      let y = isRate ? chartHeight - padding - (parseFloat(t[key]) || 0) / 100 * (chartHeight - padding * 2) : chartHeight - padding - (parseInt(t[key]) || 0) / maxTotal * (chartHeight - padding * 2);
      return `${x},${y}`;
    }).join(" ");
    return `<polyline class="p11-chart-line" points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  return `
    <div>
      <svg class="p11-chart-svg" viewBox="0 0 100 ${chartHeight}" preserveAspectRatio="none">
        <line class="p11-chart-grid" x1="${padding}" y1="${chartHeight - padding}" x2="${100 - padding}" y2="${chartHeight - padding}"/>
        <line class="p11-chart-grid" x1="${padding}" y1="${chartHeight / 2}" x2="${100 - padding}" y2="${chartHeight / 2}" stroke-dasharray="2"/>
        <line class="p11-chart-sla-line" x1="${padding}" y1="${slaY}" x2="${100 - padding}" y2="${slaY}"/>
        ${createLine(trend, "var(--p11-accent)", "total")}
        ${createLine(trend, "var(--p11-ok)", "success")}
        ${createLine(trend, "var(--p11-error)", "error")}
      </svg>
      <div class="p11-chart-dates">
        <span>${trend[0]?.date ? new Date(trend[0].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</span>
        <span>${trend[Math.floor(trend.length / 2)]?.date ? new Date(trend[Math.floor(trend.length / 2)].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</span>
        <span>${trend[trend.length - 1]?.date ? new Date(trend[trend.length - 1].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</span>
      </div>
    </div>
  `;
}
var chart_default = { renderTrendChart };
const MODULE_ID = "panels-ui-render-chart";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { chartReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  chart_default as default,
  healthCheck,
  info,
  renderTrendChart
};
