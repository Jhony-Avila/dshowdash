const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-15:ui:renderers";
const SORT_SVGS = {
  asc: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>',
  desc: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  none: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"><polyline points="18 15 12 9 6 15"/></svg>'
};
const escape = (str) => {
  if (!str) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(str).replace(/[&<>"']/g, (m) => map[m]);
};
const renderOverview = (overview) => {
  if (!overview) return '<div class="p15-overview p15-overview--empty">Sem dados de overview</div>';
  return `<div class="p15-overview"><div class="p15-overview__item"><span class="p15-overview__label">Total Jobs</span><span class="p15-overview__value">${overview.total_jobs ?? "--"}</span></div><div class="p15-overview__item"><span class="p15-overview__label">Ativos</span><span class="p15-overview__value p15-overview__value--success">${overview.active_jobs ?? "--"}</span></div><div class="p15-overview__item"><span class="p15-overview__label">Em Execu\xE7\xE3o</span><span class="p15-overview__value p15-overview__value--info">${overview.running_jobs ?? "--"}</span></div><div class="p15-overview__item"><span class="p15-overview__label">Erros (24h)</span><span class="p15-overview__value p15-overview__value--danger">${overview.errors_24h ?? "--"}</span></div></div>`;
};
const renderActivityTable = (activities, sort = {}) => {
  if (!activities?.length) return renderEmpty("Nenhuma atividade recente");
  const headers = ["Job", "Status", "Dura\xE7\xE3o", "Hor\xE1rio"].map((h, i) => {
    const fields = ["job_name", "status", "duration", "executed_at"];
    const field = fields[i];
    const isSorted = sort.field === field;
    const icon = isSorted ? SORT_SVGS[sort.dir] : SORT_SVGS.none;
    return `<th class="p15-th p15-sortable ${isSorted ? `p15-sorted--${sort.dir}` : ""}" data-field="${field}">${h}${icon}</th>`;
  }).join("");
  const rows = activities.map((a) => `<tr class="p15-tr"><td class="p15-td">${escape(a.job_name)}</td><td class="p15-td"><span class="p15-status p15-status--${String(a.status ?? "").toLowerCase()}">${a.status}</span></td><td class="p15-td">${a.duration ? `${a.duration}s` : "--"}</td><td class="p15-td">${a.executed_at || "--"}</td></tr>`).join("");
  return `<table class="p15-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
};
const renderTopJobs = (jobs, sort = {}) => {
  if (!jobs?.length) return renderEmpty("Nenhum job encontrado");
  const headers = ["Job", "Execu\xE7\xF5es", "Taxa Sucesso", "Tempo M\xE9dio"].map((h, i) => {
    const fields = ["job_name", "total_executions", "success_rate", "avg_duration"];
    const field = fields[i];
    const isSorted = sort.field === field;
    const icon = isSorted ? SORT_SVGS[sort.dir] : SORT_SVGS.none;
    return `<th class="p15-th p15-sortable ${isSorted ? `p15-sorted--${sort.dir}` : ""}" data-field="${field}">${h}${icon}</th>`;
  }).join("");
  const rows = jobs.map((j) => `<tr class="p15-tr"><td class="p15-td">${escape(j.job_name)}</td><td class="p15-td">${j.total_executions ?? "--"}</td><td class="p15-td">${j.success_rate != null ? `${j.success_rate}%` : "--"}</td><td class="p15-td">${j.avg_duration ? `${j.avg_duration}s` : "--"}</td></tr>`).join("");
  return `<table class="p15-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
};
const renderEmpty = (message = "Nenhum dado dispon\xEDvel") => `<div class="p15-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>${message}</p></div>`;
const renderLoading = () => `<div class="p15-loading"><div class="p15-spinner"></div><span>Carregando...</span></div>`;
const renderError = (message) => `<div class="p15-error"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><p>${escape(message || "Erro ao carregar")}</p></div>`;
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderersReady: true } });
const renderDashboard = renderOverview;
const renderTopJobsTable = renderTopJobs;
var renderers_default = { renderOverview, renderActivityTable, renderTopJobs, renderEmpty, renderLoading, renderError, info, healthCheck, renderDashboard, renderTopJobsTable };
export {
  MODULE_ID,
  VERSION,
  renderers_default as default,
  healthCheck,
  info,
  renderActivityTable,
  renderDashboard,
  renderEmpty,
  renderError,
  renderLoading,
  renderOverview,
  renderTopJobs,
  renderTopJobsTable
};
