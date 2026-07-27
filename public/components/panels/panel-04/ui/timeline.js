const MODULE_ID = "panel-04-ui-timeline";
const VERSION = "9.3.0-P2-ENTERPRISE";
const SEVERITY_COLORS = { critical: "#dc2626", high: "#ef4444", medium: "#f59e0b", low: "#22c55e", default: "#6366f1" };
function renderTimeline(container, timeline) {
  if (!container) return;
  const timelineEl = container.querySelector("[data-timeline]");
  if (!timelineEl) return;
  if (!timeline || !timeline.length) {
    timelineEl.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#606070;font-size:11px;"><span>Sem dados no per\xEDodo</span></div>';
    return;
  }
  const maxTotal = Math.max(...timeline.map((t) => t.total || 0).concat([1]));
  const bars = timeline.map((t, i) => {
    const height = Math.max((t.total || 0) / maxTotal * 100, 3);
    const hour = t.hour ? new Date(t.hour).getHours() : i;
    let color = SEVERITY_COLORS.default;
    if (t.critical > 0) color = SEVERITY_COLORS.critical;
    else if (t.high > 0) color = SEVERITY_COLORS.high;
    else if (t.medium > 0) color = SEVERITY_COLORS.medium;
    else if (t.low > 0) color = SEVERITY_COLORS.low;
    const showLabel = timeline.length <= 12 || i % Math.ceil(timeline.length / 8) === 0;
    return `<div class="p04-timeline-bar" style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;cursor:pointer;" title="${t.total || 0} alertas \xE0s ${hour}h&#10;Cr\xEDtico: ${t.critical || 0}&#10;Alto: ${t.high || 0}&#10;M\xE9dio: ${t.medium || 0}&#10;Baixo: ${t.low || 0}"><div style="width:70%;height:${height}%;background:${color};border-radius:2px 2px 0 0;min-height:2px;transition:all 0.3s ease;opacity:0.8;" onmouseover="this.style.opacity='1';this.style.transform='scaleX(1.2)'" onmouseout="this.style.opacity='0.8';this.style.transform='scaleX(1)'"></div>${showLabel ? `<span style="font-size:8px;color:#606070;margin-top:2px;">${hour}h</span>` : ""}</div>`;
  }).join("");
  timelineEl.innerHTML = `<div style="display:flex;align-items:flex-end;height:65px;gap:1px;padding:0 2px;">${bars}</div>`;
}
function renderTopJobs(container, topJobs) {
  if (!container) return;
  const topJobsEl = container.querySelector("[data-top-jobs]");
  if (!topJobsEl) return;
  if (!topJobs || !topJobs.length) {
    topJobsEl.innerHTML = '<div style="color:#606070;font-size:11px;text-align:center;padding:10px;">Nenhum job com alertas</div>';
    return;
  }
  const maxAlerts = Math.max(...topJobs.map((j) => parseInt(String(j.total_alerts)) || 0).concat([1]));
  const items = topJobs.slice(0, 5).map((job, index) => {
    const total = parseInt(String(job.total_alerts)) || 0;
    const pct = total / maxAlerts * 100;
    const jobName = job.job_name || "Unknown";
    const shortName = jobName.length > 18 ? `${jobName.substring(0, 18)}...` : jobName;
    const gradientStart = index === 0 ? "#dc2626" : index === 1 ? "#ef4444" : "#f59e0b";
    const gradientEnd = "#f59e0b";
    return `<div class="p04-top-job" style="display:flex;align-items:center;gap:6px;padding:2px 0;" title="${jobName}: ${total} alertas"><span style="font-size:9px;color:#606070;width:12px;">${index + 1}.</span><span style="font-size:10px;color:#a0a0b0;min-width:70px;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;">${shortName}</span><div style="flex:1;height:6px;background:#1a1a24;border-radius:3px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${gradientStart},${gradientEnd});border-radius:3px;transition:width 0.3s ease;"></div></div><span style="font-size:10px;color:${index === 0 ? "#dc2626" : "#ef4444"};min-width:28px;text-align:right;font-weight:${index === 0 ? "600" : "400"};">${total}</span></div>`;
  }).join("");
  topJobsEl.innerHTML = items;
}
function clearTimeline(container) {
  if (!container) return;
  const timelineEl = container.querySelector("[data-timeline]");
  if (timelineEl) timelineEl.innerHTML = "";
}
function clearTopJobs(container) {
  if (!container) return;
  const topJobsEl = container.querySelector("[data-top-jobs]");
  if (topJobsEl) topJobsEl.innerHTML = "";
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { moduleAvailable: true }, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, severityColors: Object.keys(SEVERITY_COLORS).length, p25Compliant: true };
}
var timeline_default = { renderTimeline, renderTopJobs, clearTimeline, clearTopJobs, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  clearTimeline,
  clearTopJobs,
  timeline_default as default,
  healthCheck,
  info,
  renderTimeline,
  renderTopJobs
};
