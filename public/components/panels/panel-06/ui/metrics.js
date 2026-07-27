const MODULE_ID = "panel-06.ui.metrics";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderMetricCard(container, { label, value, unit = "", trend = null }) {
  const trendIcon = trend > 0 ? "fa-arrow-up text-success" : trend < 0 ? "fa-arrow-down text-danger" : "";
  const trendClass = trend > 0 ? "positive" : trend < 0 ? "negative" : "neutral";
  const html = `
        <div class="metric-card">
            <div class="metric-label">${label}</div>
            <div class="metric-value">${value}${unit ? `<span class="metric-unit">${unit}</span>` : ""}</div>
            ${trend !== null ? `<div class="metric-trend ${trendClass}"><i class="fas ${trendIcon}"></i> ${Math.abs(trend)}%</div>` : ""}
        </div>
    `;
  if (container instanceof HTMLElement) {
    container.innerHTML = html;
  }
  return html;
}
function renderMetricsGrid(container, metrics = []) {
  const html = `<div class="metrics-grid">${metrics.map((m) => renderMetricCard(null, m)).join("")}</div>`;
  if (container instanceof HTMLElement) {
    container.innerHTML = html;
  }
  return html;
}
var metrics_default = { renderMetricCard, renderMetricsGrid };
export {
  MODULE_ID,
  VERSION,
  metrics_default as default,
  renderMetricCard,
  renderMetricsGrid
};
