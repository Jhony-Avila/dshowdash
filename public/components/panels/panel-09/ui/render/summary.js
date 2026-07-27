import { PERIODS } from "../constants.js";
import { formatNumber, getChangeArrow, getChangeColor, getRateColor, ARROW_SVGS } from "../helpers.js";
function renderSuccessRate(container, data) {
  const sr = data.success_rate;
  if (!sr) return;
  const rateEl = container.querySelector("[data-success-rate]");
  const changeEl = container.querySelector("[data-success-change]");
  if (rateEl) {
    rateEl.textContent = `${sr.today.toFixed(1)}%`;
    rateEl.style.color = getRateColor(sr.today);
  }
  if (changeEl) {
    const arrow = getChangeArrow(sr.change);
    const color = getChangeColor(sr.change);
    changeEl.innerHTML = `${arrow} ${Math.abs(sr.change).toFixed(1)}%`;
    changeEl.style.color = color;
  }
}
function renderMiniDonut(container, data) {
  const donutEl = container.querySelector("[data-donut]");
  if (!donutEl) return;
  const successRate = data.success_rate;
  const sr = successRate && successRate.today || 0;
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - sr / 100 * circumference;
  donutEl.innerHTML = `<svg viewBox="0 0 44 44" style="transform:rotate(-90deg);"><circle cx="22" cy="22" r="18" fill="none" stroke="#2a2a3a" stroke-width="4"/><circle class="p09-donut-segment" cx="22" cy="22" r="18" fill="none" stroke="${getRateColor(sr)}" stroke-width="4" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"/></svg>`;
}
function renderSparkline(container, data) {
  const sparklineEl = container.querySelector("[data-sparkline-success]");
  if (!sparklineEl) return;
  const sparkline = data.sparkline;
  const sparkData = sparkline && sparkline.success || [];
  if (!sparkData.length) {
    sparklineEl.innerHTML = "";
    return;
  }
  const max = Math.max.apply(null, sparkData.concat([1]));
  const width = 100 / sparkData.length;
  const bars = sparkData.map((v, i) => {
    const h = Math.max(v / max * 20, 1);
    return `<rect x="${i * width}" y="${24 - h}" width="${width - 0.5}" height="${h}" fill="#22c55e" opacity="0.6"/>`;
  }).join("");
  sparklineEl.innerHTML = `<svg viewBox="0 0 100 24" preserveAspectRatio="none" style="width:100%;height:100%;">${bars}</svg>`;
}
function renderSummaryCards(container, data, activeTab) {
  const cardsEl = container.querySelector("[data-summary-cards]");
  if (!cardsEl) return;
  const periods = Object.keys(PERIODS);
  cardsEl.innerHTML = periods.map((period) => {
    const periodData = data[period];
    if (!periodData) return "";
    const change = parseFloat(periodData.change && periodData.change.total) || 0;
    const isPositive = change >= 0;
    const arrow = isPositive ? ARROW_SVGS.up : ARROW_SVGS.down;
    const color = isPositive ? "#22c55e" : "#ef4444";
    const isActive = period === activeTab;
    const periodConfig = PERIODS[period];
    const icon = periodConfig.icon;
    const label = periodConfig.label;
    const currentTotal = periodData.current && periodData.current.total || 0;
    const previousTotal = periodData.previous && periodData.previous.total || 0;
    return `<div class="p09-card" data-tab-click="${period}" style="background:${isActive ? "#1e1e2d" : "#16161f"};border:1px solid ${isActive ? "#6366f1" : "#2a2a3a"};border-radius:8px;padding:14px;cursor:pointer;transition:all 0.2s;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><span style="font-size:14px;">${icon}</span><span style="font-size:10px;color:#606070;text-transform:uppercase;">${label}</span></div><div style="display:flex;align-items:baseline;gap:6px;"><span style="font-size:22px;font-weight:700;color:#f0f0f5;">${formatNumber(currentTotal)}</span><span style="font-size:11px;color:${color};font-weight:500;display:inline-flex;align-items:center;gap:2px;">${arrow} ${Math.abs(change).toFixed(1)}%</span></div><div style="font-size:9px;color:#606070;margin-top:4px;">vs ${formatNumber(previousTotal)}</div></div>`;
  }).join("");
}
var summary_default = { renderSuccessRate, renderMiniDonut, renderSparkline, renderSummaryCards };
const MODULE_ID = "panels-ui-render-summary";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  summary_default as default,
  healthCheck,
  info,
  renderMiniDonut,
  renderSparkline,
  renderSuccessRate,
  renderSummaryCards
};
