// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-17:ui:renderers
// PURPOSE: Panel-17 - Renderers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   escape from ./formatters.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderTableHeader() — exported function
//   renderTableRow() — exported function
//   renderTable() — exported function
//   renderEmpty() — exported function
//   renderLoading() — exported function
//   renderError() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { escape, formatDateTime, formatDuration } from './formatters.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-17:ui:renderers';

const SORT_SVGS = {
  asc: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>',
  desc: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  none: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"><polyline points="18 15 12 9 6 15"/></svg>'
};

export const renderTableHeader = (columns: Record<string, unknown>[], sort: Record<string, unknown> = {}) => {
  const headers = columns.map((col: Record<string, unknown>) => {
    const sortable = col.sortable !== false;
    const isSorted = sort.field === col.key;
    const sortIcon = isSorted ? SORT_SVGS[sort.dir as keyof typeof SORT_SVGS] : (sortable ? SORT_SVGS.none : '');
    const sortClass = sortable ? 'p17-sortable' : '';
    const sortedClass = isSorted ? `p17-sorted p17-sorted--${sort.dir}` : '';
    return `<th class="p17-th ${sortClass} ${sortedClass}" data-field="${col.key}" ${sortable ? 'role="button" tabindex="0"' : ''}>${escape(col.label)}${sortIcon}</th>`;
  }).join('');
  return `<thead class="p17-thead"><tr>${headers}</tr></thead>`;
};

export const renderTableRow = (item: Record<string, unknown>, columns: Record<string, unknown>[]) => {
  const cells = columns.map((col: Record<string, unknown>) => {
    const value = col.render ? (col.render as (item: Record<string, unknown>) => unknown)(item) : (item[col.key as string] ?? '--');
    return `<td class="p17-td" data-field="${col.key}">${value}</td>`;
  }).join('');
  return `<tr class="p17-tr" data-id="${item.id || ''}">${cells}</tr>`;
};

export const renderTable = (items: Record<string, unknown>[], columns: Record<string, unknown>[], sort: Record<string, unknown> = {}) => {
  if (!items?.length) return renderEmpty();
  const header = renderTableHeader(columns, sort);
  const rows = items.map((item: Record<string, unknown>) => renderTableRow(item, columns)).join('');
  return `<table class="p17-table">${header}<tbody class="p17-tbody">${rows}</tbody></table>`;
};

export const renderEmpty = (message = 'Nenhum dado disponível') => `<div class="p17-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg><p>${message}</p></div>`;

export const renderLoading = () => `<div class="p17-loading"><div class="p17-spinner"></div><span>Carregando...</span></div>`;

export const renderError = (message: string) => `<div class="p17-error"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>${escape(message || 'Erro ao carregar dados')}</p></div>`;

// ── Activity helpers ──────────────────────────────────────────
const _statusClass = (status: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'success') return 'p17-status--success';
  if (s === 'error' || s === 'failed') return 'p17-status--error';
  if (s === 'running') return 'p17-status--running';
  return 'p17-status--inactive';
};

const _statusLabel = (status: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'success') return 'Sucesso';
  if (s === 'error' || s === 'failed') return 'Erro';
  if (s === 'running') return 'Executando';
  return escape(status) || '--';
};

// ── Activity Table ────────────────────────────────────────────
export const renderActivityTable = (
  items: Record<string, unknown>[],
  page = 1,
  perPage = 10
): string => {
  if (!items || items.length === 0) return renderEmpty('Nenhuma atividade recente');
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);
  const maxPage = Math.ceil(items.length / perPage);
  const rows = pageItems.map((item: Record<string, unknown>) => {
    const status = String(item.status || '');
    const duration = item.execution_time_seconds != null ? formatDuration(item.execution_time_seconds) : '--';
    return `<tr class="p17-tr" data-job-name="${escape(String(item.job_name || ''))}">
      <td class="p17-td">${escape(String(item.job_name || '--'))}</td>
      <td class="p17-td"><span class="p17-status ${_statusClass(status)}">${_statusLabel(status)}</span></td>
      <td class="p17-td">${formatDateTime(String(item.execution_start || ''))}</td>
      <td class="p17-td">${duration}</td>
    </tr>`;
  }).join('');
  const pagination = maxPage > 1
    ? `<div class="p17-pagination">
        <button class="p17-btn p17-btn--sm" data-action="activity-prev" ${page <= 1 ? 'disabled' : ''}>&#8249;</button>
        <span class="p17-page-info">${page} / ${maxPage}</span>
        <button class="p17-btn p17-btn--sm" data-action="activity-next" ${page >= maxPage ? 'disabled' : ''}>&#8250;</button>
       </div>`
    : '';
  return `<table class="p17-table p17-activity-table">
    <thead class="p17-thead"><tr>
      <th class="p17-th">Job</th>
      <th class="p17-th">Status</th>
      <th class="p17-th">Execução</th>
      <th class="p17-th">Duração</th>
    </tr></thead>
    <tbody class="p17-tbody">${rows}</tbody>
  </table>${pagination}`;
};

// ── Top Jobs Table ────────────────────────────────────────────
export const renderTopJobsTable = (
  jobs: Record<string, unknown>[],
  sort: Record<string, unknown> = {}
): string => {
  if (!jobs || jobs.length === 0) return renderEmpty('Nenhum job encontrado');
  const columns = [
    { key: 'job_name', label: 'Job', sortable: true },
    { key: 'total_executions', label: 'Execuções', sortable: true },
    { key: 'success_rate', label: 'Taxa (%)', sortable: true },
    { key: 'avg_execution_time', label: 'Tempo Médio', sortable: true }
  ];
  const header = renderTableHeader(columns as Record<string, unknown>[], sort);
  const rows = jobs.map((job: Record<string, unknown>) => {
    const rate = parseFloat(String(job.success_rate || 0));
    const rateClass = rate >= 95 ? 'p17-rate--high' : rate >= 80 ? 'p17-rate--medium' : 'p17-rate--low';
    return `<tr class="p17-tr" data-job-name="${escape(String(job.job_name || ''))}">
      <td class="p17-td">${escape(String(job.job_name || '--'))}</td>
      <td class="p17-td">${parseInt(String(job.total_executions || 0)).toLocaleString('pt-BR')}</td>
      <td class="p17-td"><span class="${rateClass}">${rate.toFixed(1)}%</span></td>
      <td class="p17-td">${formatDuration(job.avg_execution_time)}</td>
    </tr>`;
  }).join('');
  return `<table class="p17-table p17-top-jobs-table">${header}<tbody class="p17-tbody">${rows}</tbody></table>`;
};

// ── KPI / Overview Cards ──────────────────────────────────────
const _renderKpiCards = (overview: Record<string, unknown>): string => {
  if (!overview) return '';
  const kpis: Array<{ label: string; value: unknown; sub?: string; mod?: string }> = [
    { label: 'Total de Jobs', value: overview.total_jobs ?? overview.totalJobs ?? '--' },
    { label: 'Jobs Ativos', value: overview.active_jobs ?? overview.activeJobs ?? '--', mod: 'p17-kpi--active' },
    { label: 'Execuções (24h)', value: overview.total_executions ?? overview.executions ?? '--' },
    { label: 'Taxa de Sucesso', value: overview.success_rate != null ? `${parseFloat(String(overview.success_rate)).toFixed(1)}%` : '--', mod: 'p17-kpi--rate' }
  ];
  return `<div class="p17-kpi-grid">${kpis.map(k => `<div class="p17-kpi-card ${k.mod || ''}"><div class="p17-kpi-label">${k.label}</div><div class="p17-kpi-value">${escape(String(k.value))}</div></div>`).join('')}</div>`;
};

// ── Alerts Bar ────────────────────────────────────────────────
const _renderAlerts = (alertsSummary: Record<string, unknown> | null | undefined): string => {
  if (!alertsSummary) return '';
  const total = parseInt(String(alertsSummary.total || 0));
  if (!total) return '';
  return `<div class="p17-alerts-bar"><span class="p17-alert-count">${total} alerta${total !== 1 ? 's' : ''}</span></div>`;
};

// ── Main Dashboard ────────────────────────────────────────────
export const renderDashboard = (
  overview: Record<string, unknown>,
  alertsSummary: Record<string, unknown> | null | undefined,
  recentActivity: Record<string, unknown>[],
  topJobs: Record<string, unknown>[],
  activityPage = 1,
  activityPerPage = 10,
  topJobsSort: Record<string, unknown> = {}
): string => {
  const kpiCards = _renderKpiCards(overview);
  const alerts = _renderAlerts(alertsSummary);
  const activityTableHtml = renderActivityTable(recentActivity, activityPage, activityPerPage);
  const topJobsTableHtml = renderTopJobsTable(topJobs, topJobsSort);
  return `<div class="p17-dashboard">
    ${alerts}
    <section class="p17-section p17-section--overview">${kpiCards}</section>
    <section class="p17-section p17-section--activity">
      <header class="p17-section-header">
        <h2 class="p17-section-title">Atividade Recente</h2>
        <button class="p17-btn p17-btn--sm p17-btn--secondary" data-action="export-activity">Exportar</button>
      </header>
      <div class="p17-section-body" id="p17-activity-table">${activityTableHtml}</div>
    </section>
    <section class="p17-section p17-section--top-jobs">
      <header class="p17-section-header">
        <h2 class="p17-section-title">Top Jobs</h2>
        <button class="p17-btn p17-btn--sm p17-btn--secondary" data-action="export-top-jobs">Exportar</button>
      </header>
      <div class="p17-section-body">${topJobsTableHtml}</div>
    </section>
  </div>`;
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { renderersReady: true } });
export default { renderTableHeader, renderTableRow, renderTable, renderEmpty, renderLoading, renderError, renderActivityTable, renderTopJobsTable, renderDashboard, info, healthCheck };
