import { formatNumber } from "../helpers.js";
function renderLineChart(container, data) {
  const chartEl = container.querySelector("[data-line-chart]");
  if (!chartEl) return;
  const trend = data.trend_7_days || [];
  if (!trend.length) {
    chartEl.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#606070;">Sem dados de tend\xEAncia</div>';
    return;
  }
  const maxTotal = Math.max(...trend.map((t) => parseInt(t.total)), 1);
  const padding = 10;
  const createPoints = (key) => trend.map((t, i) => {
    const x = padding + i / (trend.length - 1) * (100 - padding * 2);
    const y = 100 - padding - parseInt(t[key]) / maxTotal * (100 - padding * 2);
    return `${x},${y}`;
  }).join(" ");
  chartEl.innerHTML = `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%;">
      <line x1="10" y1="90" x2="90" y2="90" stroke="#2a2a3a" stroke-width="0.5"/>
      <line x1="10" y1="50" x2="90" y2="50" stroke="#2a2a3a" stroke-width="0.3" stroke-dasharray="2"/>
      <line x1="10" y1="10" x2="90" y2="10" stroke="#2a2a3a" stroke-width="0.3" stroke-dasharray="2"/>
      <polyline points="${createPoints("total")}" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${createPoints("success")}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${createPoints("failed")}" fill="none" stroke="#ef4444" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3"/>
      ${trend.map((t, i) => {
    const x = padding + i / (trend.length - 1) * (100 - padding * 2);
    const y = 100 - padding - parseInt(t.total) / maxTotal * (100 - padding * 2);
    return `<circle cx="${x}" cy="${y}" r="2" fill="#6366f1" data-tooltip-trigger data-value="${t.total}" data-date="${t.date}" data-rate="${t.success_rate}%"/>`;
  }).join("")}
    </svg>
    <div style="display:flex;justify-content:space-between;margin-top:4px;padding:0 10px;">
      ${trend.map((t) => `<span style="font-size:9px;color:#606070;">${new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>`).join("")}
    </div>
  `;
}
function renderBarChart(container, data, activeTab) {
  const chartEl = container.querySelector("[data-bar-chart]");
  if (!chartEl) return;
  const periodData = data[activeTab];
  if (!periodData) {
    chartEl.innerHTML = "";
    return;
  }
  const metrics = [
    { label: "Execu\xE7\xF5es", current: parseFloat(periodData.current?.total) || 0, previous: parseFloat(periodData.previous?.total) || 0 },
    { label: "Sucessos", current: parseFloat(periodData.current?.success) || 0, previous: parseFloat(periodData.previous?.success) || 0 }
  ];
  const maxValue = Math.max(...metrics.flatMap((m) => [m.current, m.previous]), 1);
  chartEl.innerHTML = `
    <div style="display:flex;align-items:flex-end;justify-content:space-around;height:100%;gap:16px;padding:0 16px;">
      ${metrics.map((m) => {
    const currentHeight = m.current / maxValue * 100;
    const previousHeight = m.previous / maxValue * 100;
    return `
          <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:6px;">
            <div style="display:flex;align-items:flex-end;gap:6px;height:70px;width:100%;">
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
                <span style="font-size:9px;color:#6366f1;margin-bottom:2px;">${formatNumber(m.current)}</span>
                <div class="p09-bar" style="width:100%;max-width:35px;height:${currentHeight}%;background:linear-gradient(180deg,#6366f1,#4f46e5);border-radius:3px 3px 0 0;min-height:2px;"></div>
              </div>
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
                <span style="font-size:9px;color:#606070;margin-bottom:2px;">${formatNumber(m.previous)}</span>
                <div class="p09-bar" style="width:100%;max-width:35px;height:${previousHeight}%;background:#3a3a4a;border-radius:3px 3px 0 0;min-height:2px;"></div>
              </div>
            </div>
            <span style="font-size:10px;color:#a0a0b0;">${m.label}</span>
          </div>
        `;
  }).join("")}
    </div>
  `;
}
var charts_default = { renderLineChart, renderBarChart };
const MODULE_ID = "panels-ui-render-charts";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { chartsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  charts_default as default,
  healthCheck,
  info,
  renderBarChart,
  renderLineChart
};
