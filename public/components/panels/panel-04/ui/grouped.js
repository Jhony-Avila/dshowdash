import { ALERT_TYPES } from "../core/constants.js";
import { formatDate, escapeHtml, truncateText } from "./helpers.js";
const MODULE_ID = "panel-04-ui-grouped";
const VERSION = "9.3.0-P2-ENTERPRISE";
const SEVERITY_SVGS = {
  critical: '<svg width="12" height="12" viewBox="0 0 24 24" style="vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#dc2626"/></svg>',
  high: '<svg width="12" height="12" viewBox="0 0 24 24" style="vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#ef4444"/></svg>',
  medium: '<svg width="12" height="12" viewBox="0 0 24 24" style="vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#f59e0b"/></svg>',
  low: '<svg width="12" height="12" viewBox="0 0 24 24" style="vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#22c55e"/></svg>'
};
const CHEVRON_SVGS = {
  right: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;transition:transform 0.2s ease;"><polyline points="9 18 15 12 9 6"/></svg>',
  down: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>'
};
const FOLDER_SVG = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>';
function renderGrouped(container, grouped, options = {}) {
  if (!container) return;
  const expandedJobs = options && options.expandedJobs || /* @__PURE__ */ new Set();
  const filterText = options && options.filterText || "";
  const onJobToggle = options && options.onJobToggle;
  const groupedView = container.querySelector("[data-grouped-view]");
  const countEl = container.querySelector("[data-count]");
  if (!groupedView) return;
  let filteredGrouped = (grouped || []).slice();
  if (filterText) {
    const search = filterText.toLowerCase();
    filteredGrouped = filteredGrouped.filter((g) => g.job_name && g.job_name.toLowerCase().indexOf(search) !== -1 || g.last_message && g.last_message.toLowerCase().indexOf(search) !== -1);
  }
  if (countEl) {
    countEl.textContent = `${filteredGrouped.length} job${filteredGrouped.length !== 1 ? "s" : ""}`;
  }
  if (filteredGrouped.length === 0) {
    groupedView.innerHTML = `<div style="padding:40px;text-align:center;color:#606070;"><div style="display:flex;flex-direction:column;align-items:center;gap:8px;">${FOLDER_SVG}<span>Nenhum job encontrado</span></div></div>`;
    return;
  }
  const groups = filteredGrouped.map((g) => {
    const isExpanded = expandedJobs.has(g.job_name);
    const jobName = escapeHtml(g.job_name || "Unknown");
    const types = g.types || {};
    let mainType = "alert-low";
    if (types["alert-critical"] > 0) mainType = "alert-critical";
    else if (types["alert-high"] > 0) mainType = "alert-high";
    else if (types["alert-medium"] > 0) mainType = "alert-medium";
    const alertConfig = ALERT_TYPES[mainType] || ALERT_TYPES["alert-low"];
    const lastMessage = escapeHtml(truncateText(g.last_message || "", 100));
    const lastAlert = formatDate(g.last_alert);
    const totalCount = g.count || 0;
    const chevronSvg = isExpanded ? CHEVRON_SVGS.down : CHEVRON_SVGS.right;
    let detailsHtml = "";
    if (isExpanded) {
      let typesHtml = "";
      if (types["alert-critical"] > 0) typesHtml += `<span style="display:flex;align-items:center;gap:3px;color:#dc2626;">${SEVERITY_SVGS.critical} ${types["alert-critical"]} cr\xEDtico${types["alert-critical"] !== 1 ? "s" : ""}</span>`;
      if (types["alert-high"] > 0) typesHtml += `<span style="display:flex;align-items:center;gap:3px;color:#ef4444;">${SEVERITY_SVGS.high} ${types["alert-high"]} alto${types["alert-high"] !== 1 ? "s" : ""}</span>`;
      if (types["alert-medium"] > 0) typesHtml += `<span style="display:flex;align-items:center;gap:3px;color:#f59e0b;">${SEVERITY_SVGS.medium} ${types["alert-medium"]} m\xE9dio${types["alert-medium"] !== 1 ? "s" : ""}</span>`;
      if (types["alert-low"] > 0) typesHtml += `<span style="display:flex;align-items:center;gap:3px;color:#22c55e;">${SEVERITY_SVGS.low} ${types["alert-low"]} baixo${types["alert-low"] !== 1 ? "s" : ""}</span>`;
      detailsHtml = `<div class="p04-job-details" style="border-top:1px solid #2a2a3a;padding:12px 14px;background:#12121a;"><div style="font-size:11px;color:#a0a0b0;margin-bottom:10px;line-height:1.4;"><strong style="color:#606070;">\xDAltima mensagem:</strong><br/>${lastMessage || '<em style="color:#606070;">Sem mensagem</em>'}</div><div style="display:flex;gap:12px;font-size:10px;flex-wrap:wrap;">${typesHtml}</div></div>`;
    }
    return `<div class="p04-job-group" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;overflow:hidden;transition:all 0.2s ease;"><div data-job-toggle="${escapeHtml(g.job_name)}" class="p04-job-header" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;cursor:pointer;transition:background 0.15s ease;"><div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;"><span style="font-size:12px;color:#606070;">${chevronSvg}</span><span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#f0f0f5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${jobName}</span><span style="padding:3px 8px;background:${alertConfig.bg};color:${alertConfig.color};border-radius:4px;font-size:10px;font-weight:500;white-space:nowrap;">${totalCount} alerta${totalCount !== 1 ? "s" : ""}</span></div><span style="font-size:10px;color:#606070;white-space:nowrap;margin-left:10px;">${lastAlert}</span></div>${detailsHtml}</div>`;
  }).join("");
  groupedView.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;padding-right:4px;">${groups}</div>`;
  if (onJobToggle) {
    groupedView.querySelectorAll("[data-job-toggle]").forEach((toggle) => {
      const t = toggle;
      const jobName = t.dataset.jobToggle;
      t.addEventListener("click", () => {
        onJobToggle(jobName);
      });
      t.addEventListener("mouseenter", () => {
        t.style.background = "#1a1a24";
      });
      t.addEventListener("mouseleave", () => {
        t.style.background = "transparent";
      });
    });
  }
}
function clearGrouped(container) {
  if (!container) return;
  const groupedView = container.querySelector("[data-grouped-view]");
  if (groupedView) groupedView.innerHTML = "";
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var grouped_default = { renderGrouped, clearGrouped };
export {
  MODULE_ID,
  VERSION,
  clearGrouped,
  grouped_default as default,
  healthCheck,
  renderGrouped
};
