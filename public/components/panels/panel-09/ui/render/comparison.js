import { formatNumber, formatTime } from "../helpers.js";
const SVGS = {
  zap: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  checkCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  arrowUp: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="18 15 12 9 6 15"/></svg>',
  arrowDown: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>'
};
function renderComparison(container, data, activeTab) {
  const compEl = container.querySelector("[data-comparison]");
  if (!compEl) return;
  const periodData = data[activeTab];
  if (!periodData) {
    compEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#606070;">Sem dados</div>';
    return;
  }
  const metrics = [
    { key: "total", label: "Execu\xE7\xF5es", icon: SVGS.zap, current: periodData.current?.total, previous: periodData.previous?.total, change: periodData.change?.total },
    { key: "success", label: "Sucessos", icon: SVGS.checkCircle, current: periodData.current?.success, previous: periodData.previous?.success, change: periodData.change?.success },
    { key: "avg_time", label: "Tempo M\xE9dio", icon: SVGS.clock, current: periodData.current?.avg_time, previous: periodData.previous?.avg_time, change: periodData.change?.avg_time, isTime: true, invertColor: true }
  ];
  compEl.innerHTML = metrics.map((m) => {
    const change = parseFloat(m.change) || 0;
    const isPositive = m.invertColor ? change <= 0 : change >= 0;
    const arrow = change >= 0 ? SVGS.arrowUp : SVGS.arrowDown;
    const color = isPositive ? "#22c55e" : "#ef4444";
    const bgColor = isPositive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)";
    const currentVal = m.isTime ? formatTime(m.current) : formatNumber(m.current);
    const previousVal = m.isTime ? formatTime(m.previous) : formatNumber(m.previous);
    const currentNum = parseFloat(m.current) || 0;
    const previousNum = parseFloat(m.previous) || 1;
    const progressPct = Math.min(currentNum / previousNum * 100, 150);
    return `<div class="p09-card p09-animate" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:14px;position:relative;overflow:hidden;transition:all 0.2s;"><div style="position:absolute;top:10px;right:10px;padding:3px 8px;background:${bgColor};border-radius:10px;font-size:10px;font-weight:600;color:${color};display:inline-flex;align-items:center;gap:2px;">${arrow} ${Math.abs(change).toFixed(1)}%</div><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="display:inline-flex;">${m.icon}</span><span style="font-size:11px;color:#a0a0b0;font-weight:500;">${m.label}</span></div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;"><span style="font-size:10px;color:#6366f1;">Atual</span><span style="font-size:18px;font-weight:700;color:#f0f0f5;">${currentVal}</span></div><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:10px;color:#606070;">Anterior</span><span style="font-size:14px;font-weight:500;color:#606070;">${previousVal}</span></div><div style="margin-top:10px;height:4px;background:#2a2a3a;border-radius:2px;overflow:hidden;"><div class="p09-bar" style="height:100%;width:${Math.min(progressPct, 100)}%;background:linear-gradient(90deg,${color},${color}88);border-radius:2px;"></div></div></div>`;
  }).join("");
}
var comparison_default = { renderComparison };
const MODULE_ID = "panels-ui-render-comparison";
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
  comparison_default as default,
  healthCheck,
  info,
  renderComparison
};
