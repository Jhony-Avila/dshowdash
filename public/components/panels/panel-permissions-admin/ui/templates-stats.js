import { Icons } from "./icons.js";
import { formatTimeAgo, calculatePercentage } from "./templates-helpers.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-templates-stats";
const stats = (data) => `<div class="uarps-stats__item uarps-tooltip" data-tooltip="Total de usu\xE1rios">${Icons.users}<span class="uarps-stats__value">${data.totalUsers}</span><span class="uarps-stats__label">Usu\xE1rios</span></div><div class="uarps-stats__item uarps-tooltip" data-tooltip="Total de triggers">${Icons.zap}<span class="uarps-stats__value">${data.totalTriggers}</span><span class="uarps-stats__label">Triggers</span></div><div class="uarps-stats__item uarps-tooltip" data-tooltip="Total de regi\xF5es">${Icons.layout}<span class="uarps-stats__value">${data.totalRegions}</span><span class="uarps-stats__label">Regi\xF5es</span></div><div class="uarps-stats__divider"></div><div class="uarps-stats__item uarps-stats__item--highlight uarps-tooltip" data-tooltip="Triggers do usu\xE1rio selecionado">${Icons.checkCircle}<span class="uarps-stats__value uarps-glow--green">${data.selectedTriggers}</span><span class="uarps-stats__label">Ativos</span></div><div class="uarps-stats__item uarps-stats__item--highlight uarps-tooltip" data-tooltip="Regi\xF5es do usu\xE1rio selecionado">${Icons.eye}<span class="uarps-stats__value uarps-glow--purple">${data.selectedRegions}</span><span class="uarps-stats__label">Vis\xEDveis</span></div>`;
const statsExpanded = (data) => {
  const triggerPct = calculatePercentage(Number(data.selectedTriggers), Number(data.totalTriggers));
  const regionPct = calculatePercentage(Number(data.selectedRegions), Number(data.totalRegions));
  return `<div class="uarps-stats__group"><div class="uarps-stats__item uarps-tooltip" data-tooltip="Total de usu\xE1rios">${Icons.users}<span class="uarps-stats__value">${data.totalUsers}</span><span class="uarps-stats__label">Usu\xE1rios</span></div></div><div class="uarps-stats__group"><div class="uarps-stats__item uarps-tooltip" data-tooltip="Triggers do usu\xE1rio">${Icons.zap}<span class="uarps-stats__value uarps-glow--cyan">${data.selectedTriggers}</span><span class="uarps-stats__label">/${data.totalTriggers}</span></div><div class="uarps-progress uarps-tooltip" data-tooltip="${triggerPct}% de cobertura"><div class="uarps-progress__bar"><div class="uarps-progress__fill" style="width:${triggerPct}%"></div></div><span class="uarps-progress__text">${triggerPct}%</span></div></div><div class="uarps-stats__group"><div class="uarps-stats__item uarps-tooltip" data-tooltip="Regi\xF5es do usu\xE1rio">${Icons.layout}<span class="uarps-stats__value uarps-glow--purple">${data.selectedRegions}</span><span class="uarps-stats__label">/${data.totalRegions}</span></div><div class="uarps-progress uarps-tooltip" data-tooltip="${regionPct}% de cobertura"><div class="uarps-progress__bar"><div class="uarps-progress__fill" style="width:${regionPct}%"></div></div><span class="uarps-progress__text">${regionPct}%</span></div></div><div class="uarps-stats__group"><span class="uarps-kbd">Ctrl+Z</span> Desfazer <span class="uarps-kbd">Ctrl+Y</span> Refazer</div>`;
};
const activityTimeline = (activities = []) => {
  if (!activities.length) return "";
  let html = '<div class="uarps-focus__activity"><div class="uarps-focus__activity-title">\xDAltimas Altera\xE7\xF5es</div><div class="uarps-focus__activity-list">';
  const max = Math.min(5, activities.length);
  for (let i = 0; i < max; i++) {
    const a = activities[i];
    html += `<div class="uarps-focus__activity-item"><div class="uarps-focus__activity-icon uarps-focus__activity-icon--${a.action}">${a.action === "grant" ? Icons.checkCircle : Icons.xCircle}</div><span class="uarps-focus__activity-text">${a.label || a.triggerId}</span><span class="uarps-focus__activity-time">${formatTimeAgo(a.timestamp)}</span></div>`;
  }
  html += "</div></div>";
  return html;
};
const coverageBar = (granted, total, label = "Cobertura") => {
  const pct = calculatePercentage(granted, total);
  return `<div class="uarps-focus__coverage"><div class="uarps-focus__coverage-label"><span>${label}</span><span>${granted}/${total} (${pct}%)</span></div><div class="uarps-focus__coverage-bar"><div class="uarps-focus__coverage-fill" style="width:${pct}%"></div></div></div>`;
};
const lastEditBadge = (timestamp) => {
  if (!timestamp) return "";
  const isRecent = Date.now() - timestamp < 6e4;
  return `<span class="uarps-last-edit ${isRecent ? "uarps-last-edit--recent" : ""}">${Icons.clock || Icons.history} ${formatTimeAgo(timestamp)}</span>`;
};
const modalPreview = (data) => `<div class="uarps-modal__preview"><div class="uarps-modal__preview-title">Impacto da Opera\xE7\xE3o</div><div class="uarps-modal__preview-grid"><div class="uarps-modal__preview-item"><span class="uarps-modal__preview-label">Triggers Afetados</span><span class="uarps-modal__preview-value uarps-modal__preview-value--${data.action === "grant" ? "add" : "remove"}">${data.count}</span></div><div class="uarps-modal__preview-item"><span class="uarps-modal__preview-label">\xC1reas</span><span class="uarps-modal__preview-value uarps-modal__preview-value--neutral">${data.areas || "Todas"}</span></div><div class="uarps-modal__preview-item"><span class="uarps-modal__preview-label">Antes</span><span class="uarps-modal__preview-value">${data.before}</span></div><div class="uarps-modal__preview-item"><span class="uarps-modal__preview-label">Depois</span><span class="uarps-modal__preview-value uarps-modal__preview-value--${data.action === "grant" ? "add" : "remove"}">${data.after}</span></div></div></div>`;
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { templatesReady: typeof stats === "function" } });
export {
  MODULE_ID,
  VERSION,
  activityTimeline,
  coverageBar,
  healthCheck,
  info,
  lastEditBadge,
  modalPreview,
  stats,
  statsExpanded
};
