import { STATUS_COLORS, SORT_OPTIONS, ICONS } from "../../core/constants.js";
import { formatNumber, truncate, getUptimeStatus, getRateColor, getStatusLabel, generateSparkline } from "./utils.js";
function renderKPIs(availability, summary) {
  const uptime = availability?.availability_percent || 0;
  const uptimeStatus = getUptimeStatus(uptime);
  const total = availability?.total_executions || 0;
  const successful = availability?.successful || 0;
  const failed = availability?.failed || 0;
  const sparkData = generateSparkline(uptime);
  return `<div class="p13-kpis"><div class="p13-kpi p13-kpi-main"><div class="p13-kpi-icon" style="background: ${STATUS_COLORS[uptimeStatus]}20; color: ${STATUS_COLORS[uptimeStatus]}">${ICONS.activity}</div><div class="p13-kpi-content"><span class="p13-kpi-value" style="color: ${STATUS_COLORS[uptimeStatus]}">${uptime.toFixed(2)}%</span><span class="p13-kpi-label">Disponibilidade</span><div class="p13-sparkline">${sparkData}</div></div></div><div class="p13-kpi"><div class="p13-kpi-icon p13-kpi-icon-success">${ICONS.check}</div><div class="p13-kpi-content"><span class="p13-kpi-value">${formatNumber(successful)}</span><span class="p13-kpi-label">Execu\xE7\xF5es OK</span><span class="p13-kpi-percent">${total > 0 ? (successful / total * 100).toFixed(1) : 0}%</span></div></div><div class="p13-kpi"><div class="p13-kpi-icon p13-kpi-icon-error">${ICONS.x}</div><div class="p13-kpi-content"><span class="p13-kpi-value">${formatNumber(failed)}</span><span class="p13-kpi-label">Falhas</span><span class="p13-kpi-percent p13-kpi-percent-bad">${total > 0 ? (failed / total * 100).toFixed(1) : 0}%</span></div></div><div class="p13-kpi"><div class="p13-kpi-icon p13-kpi-icon-info">${ICONS.clock}</div><div class="p13-kpi-content"><span class="p13-kpi-value">${summary?.total_active_jobs || 0}</span><span class="p13-kpi-label">Jobs Ativos</span><span class="p13-kpi-detail">${formatNumber(total)} exec.</span></div></div></div><div class="p13-summary-bar"><div class="p13-summary-item p13-excellent" title="SLA \u2265 99%"><span class="p13-summary-dot"></span><span class="p13-summary-count">${summary?.excellent_jobs || 0}</span><span class="p13-summary-label">Excelente</span></div><div class="p13-summary-item p13-good" title="SLA \u2265 95%"><span class="p13-summary-dot"></span><span class="p13-summary-count">${summary?.good_jobs || 0}</span><span class="p13-summary-label">Bom</span></div><div class="p13-summary-item p13-warning" title="SLA \u2265 90%"><span class="p13-summary-dot"></span><span class="p13-summary-count">${summary?.warning_jobs || 0}</span><span class="p13-summary-label">Aten\xE7\xE3o</span></div><div class="p13-summary-item p13-critical" title="SLA < 90%"><span class="p13-summary-dot"></span><span class="p13-summary-count">${summary?.critical_jobs || 0}</span><span class="p13-summary-label">Cr\xEDtico</span></div></div>`;
}
function renderCriticalAlert(criticalJobs) {
  if (!criticalJobs || criticalJobs.length === 0) return "";
  return `<div class="p13-critical-alert"><div class="p13-alert-header">${ICONS.alert}<span>${criticalJobs.length} Job(s) com falhas recorrentes nos \xFAltimos 7 dias</span></div><div class="p13-alert-list">${criticalJobs.slice(0, 6).map((job) => `<div class="p13-alert-item" title="Primeiro erro: ${job.first_error}"><span class="p13-alert-name">${truncate(job.job_name, 25)}</span><span class="p13-alert-count">${job.error_count}x</span></div>`).join("")}${criticalJobs.length > 6 ? `<div class="p13-alert-more">+${criticalJobs.length - 6} mais</div>` : ""}</div></div>`;
}
function renderFiltersBar(totalJobs, filteredCount, filters) {
  const sortOptions = Object.entries(SORT_OPTIONS).map(([key, opt]) => `<option value="${key}" ${filters.sort === key ? "selected" : ""}>${opt.label}</option>`).join("");
  return `<div class="p13-filters"><div class="p13-search-box">${ICONS.search}<input type="text" data-search placeholder="Buscar job..." class="p13-search-input" value="${filters.search}"></div><div class="p13-filter-group"><select data-filter-status class="p13-select"><option value="all">Todos status</option><option value="excellent" ${filters.status === "excellent" ? "selected" : ""}>Excelente</option><option value="good" ${filters.status === "good" ? "selected" : ""}>Bom</option><option value="warning" ${filters.status === "warning" ? "selected" : ""}>Aten\xE7\xE3o</option><option value="critical" ${filters.status === "critical" ? "selected" : ""}>Cr\xEDtico</option></select><select data-sort class="p13-select">${sortOptions}</select></div><div class="p13-filter-actions"><span class="p13-results-count">${filteredCount}/${totalJobs} jobs</span><button data-export class="p13-btn-icon" title="Exportar CSV">${ICONS.download}</button></div></div>`;
}
function renderJobsTable(jobs, filters) {
  if (!jobs || jobs.length === 0) return `<div class="p13-empty">${filters.search || filters.status !== "all" ? "Nenhum job encontrado com os filtros aplicados" : "Nenhum job com dados suficientes"}</div>`;
  const sortIcon = (col) => {
    const current = SORT_OPTIONS[filters.sort];
    if (current?.field === col) return current.order === "desc" ? ICONS.chevronDown : ICONS.chevronUp;
    return "";
  };
  return `<div class="p13-table-container"><table class="p13-table"><thead><tr><th data-sort-col="job_name" class="p13-sortable">Job ${sortIcon("job_name")}</th><th>Tipo</th><th data-sort-col="success_rate" class="p13-sortable">Taxa SLA ${sortIcon("success_rate")}</th><th>Recente</th><th>Tempo</th><th data-sort-col="total_executions" class="p13-sortable">Exec. ${sortIcon("total_executions")}</th><th>Status</th></tr></thead><tbody>${jobs.slice(0, 20).map((job) => renderJobRow(job)).join("")}</tbody></table>${jobs.length > 20 ? `<div class="p13-table-footer">Exibindo 20 de ${jobs.length} jobs</div>` : ""}</div>`;
}
function renderJobRow(job) {
  const successRate = job.success_rate;
  const recentSuccessRate = job.recent_success_rate;
  const totalExecutions = job.total_executions;
  const trend = recentSuccessRate > successRate ? "up" : recentSuccessRate < successRate ? "down" : "stable";
  const trendIcon = trend === "up" ? ICONS.trendUp : trend === "down" ? ICONS.trendDown : "";
  const trendClass = trend === "up" ? "p13-trend-up" : trend === "down" ? "p13-trend-down" : "";
  return `<tr class="p13-row-${job.status}"><td class="p13-cell-name" title="${job.job_name}">${truncate(job.job_name, 28)}</td><td class="p13-cell-type">${job.job_type || "\u2014"}</td><td class="p13-cell-rate"><div class="p13-rate-wrapper"><div class="p13-rate-bar"><div class="p13-rate-fill" style="width: ${successRate}%; background: ${getRateColor(successRate)}"></div></div><span class="p13-rate-value">${successRate.toFixed(1)}%</span>${trendIcon ? `<span class="p13-trend ${trendClass}">${trendIcon}</span>` : ""}</div></td><td class="p13-cell-recent"><span class="p13-recent-ok">${job.recent_success}</span><span class="p13-recent-sep">/</span><span class="p13-recent-err">${job.recent_errors}</span><span class="p13-recent-rate">(${recentSuccessRate}%)</span></td><td class="p13-cell-time">${job.avg_execution_time}s</td><td class="p13-cell-exec">${formatNumber(totalExecutions)}</td><td class="p13-cell-status"><span class="p13-badge p13-badge-${job.status}">${getStatusLabel(job.status)}</span></td></tr>`;
}
function renderPeriodInfo(period) {
  if (!period) return "";
  return `<div class="p13-period-info"><span>Per\xEDodo: ${period.from} a ${period.to} (${period.days} dias)</span></div>`;
}
var render_default = { renderKPIs, renderCriticalAlert, renderFiltersBar, renderJobsTable, renderJobRow, renderPeriodInfo };
const MODULE_ID = "panels-ui-component-render";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  render_default as default,
  healthCheck,
  info,
  renderCriticalAlert,
  renderFiltersBar,
  renderJobRow,
  renderJobsTable,
  renderKPIs,
  renderPeriodInfo
};
