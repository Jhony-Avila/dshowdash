// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel-13 UI Component - Enterprise Modular
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SORT_OPTIONS, ICONS from ../../core/constants.js
//   VERSION as _VERSION, MODULE_ID as _MODULE_ID from ./constants.js
//   applyFilters from ./utils.js
//   renderKPIs, renderCriticalAlert, renderFiltersBar, renderJobsTable, renderPer...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';


// @ts-expect-error TS migration - TS2305
import { SORT_OPTIONS, ICONS } from '../../core/constants.js';
import { VERSION as _VERSION, MODULE_ID as _MODULE_ID } from './constants.js';
import { applyFilters } from './utils.js';
import { renderKPIs, renderCriticalAlert, renderFiltersBar, renderJobsTable, renderPeriodInfo } from './render.js';

export const VERSION = _VERSION;
export const MODULE_ID = _MODULE_ID;

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement, logger: Record<string, unknown>) {
    this.container = container;
    this.logger = logger;
    this.mounted = false;
    this.hasData = false;
    this.rawData = null;
    this.filters = { search: '', status: 'all', sort: 'SUCCESS_RATE_DESC' };
  }

  async init() {
    if (!this.container) { this.logger.error('ui.no-container'); return; }
    this.mounted = true;
    this.logger.debug('ui.init');
  }

  showLoading() {
    if (!this.container) return;
    if (this.hasData) {
      this.container.classList.add('p13-loading-overlay');
    } else {
      this.container.innerHTML = `<div class="p13-loading"><div class="p13-skeleton-header"></div><div class="p13-skeleton-kpis"><div class="p13-skeleton-kpi"></div><div class="p13-skeleton-kpi"></div><div class="p13-skeleton-kpi"></div><div class="p13-skeleton-kpi"></div></div><div class="p13-skeleton-filters"></div><div class="p13-skeleton-table">${Array(8).fill('<div class="p13-skeleton-row"></div>').join('')}</div></div>`;
    }
  }

  hideLoading() {
    if (this.container) this.container.classList.remove('p13-loading-overlay');
  }

  showError(message: string) {
    if (!this.container) return;
    this.hideLoading();
    if (this.hasData) {
      const badge = document.createElement('div');
      badge.className = 'p13-error-badge';
      badge.innerHTML = `${ICONS.alert} ${message || 'Erro'}`;
      this.container.insertBefore(badge, this.container.firstChild);
      setTimeout(() => { badge.remove(); }, 5000);
    } else {
      this.container.innerHTML = `<div class="p13-error"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><h3>Erro ao carregar</h3><p>${message || 'Não foi possível carregar os dados de SLA'}</p></div>`;
    }
  }

  update(data: Record<string, unknown>) {
    const self = this;
    if (!this.container || !data) return;
    this.hideLoading();
    try {
      this.rawData = data;
      this._render();
      this.hasData = true;
      this.logger.debug('ui.render-success', { jobs: (data.jobs_sla as unknown[] | undefined)?.length });
    } catch (error: any) {
      this.logger.error('ui.render-error', { error: error.message });
      this.showError('Erro ao renderizar dados');
    }
  }

  _render() {
    const self = this;
    const availability = this.rawData.availability;
    const jobs_sla = this.rawData.jobs_sla;
    const critical_jobs = this.rawData.critical_jobs;
    const summary = this.rawData.summary;
    const period = this.rawData.period;
    const filteredJobs = applyFilters(jobs_sla || [], this.filters, SORT_OPTIONS);
    this.container.innerHTML = renderKPIs(availability, summary) + renderCriticalAlert(critical_jobs) + renderFiltersBar(jobs_sla?.length || 0, filteredJobs.length, this.filters) + renderJobsTable(filteredJobs, this.filters) + renderPeriodInfo(period);
    this._setupEventListeners();
  }

  _setupEventListeners() {
    const self = this;
    const searchInput = this.container.querySelector('[data-search]');
    if (searchInput) {
      searchInput.value = this.filters.search;
      searchInput.addEventListener('input', (e: Event) => { self.filters.search = (e.target as HTMLInputElement).value; self._render(); });
    }
    const statusSelect = this.container.querySelector('[data-filter-status]');
    if (statusSelect) {
      statusSelect.value = this.filters.status;
      statusSelect.addEventListener('change', (e: Event) => { self.filters.status = (e.target as HTMLSelectElement).value; self._render(); });
    }
    const sortSelect = this.container.querySelector('[data-sort]');
    if (sortSelect) {
      sortSelect.value = this.filters.sort;
      sortSelect.addEventListener('change', (e: Event) => { self.filters.sort = (e.target as HTMLSelectElement).value; self._render(); });
    }
    const exportBtn = this.container.querySelector('[data-export]');
    if (exportBtn) exportBtn.addEventListener('click', () => { self._exportCSV(); });
    this.container.querySelectorAll('[data-sort-col]').forEach((th: Element) => {
      th.addEventListener('click', () => {
        const col = (th as HTMLElement).dataset.sortCol;
        const currentSort = self.filters.sort;
        if (col === 'success_rate') self.filters.sort = currentSort === 'SUCCESS_RATE_DESC' ? 'SUCCESS_RATE_ASC' : 'SUCCESS_RATE_DESC';
        else if (col === 'total_executions') self.filters.sort = 'EXECUTIONS_DESC';
        else if (col === 'job_name') self.filters.sort = 'NAME_ASC';
        self._render();
      });
    });
  }

  _exportCSV() {
    if (!this.rawData?.jobs_sla) return;
    const jobs = applyFilters(this.rawData.jobs_sla as Record<string, unknown>[], this.filters, SORT_OPTIONS);
    const headers = ['Job', 'Tipo', 'Taxa SLA (%)', 'Recentes OK', 'Recentes Erro', 'Tempo Médio (s)', 'Total Execuções', 'Status'];
    const rows = jobs.map((job: Record<string, unknown>) => [job.job_name, job.job_type || '', job.success_rate, job.recent_success, job.recent_errors, job.avg_execution_time, job.total_executions, job.status]);
    const csv = ([headers] as unknown[][]).concat(rows).map((row: unknown[]) => row.map((cell: unknown) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sla-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.logger.info('export.csv', { rows: rows.length });
  }

  async destroy() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container.classList.remove('p13-loading-overlay');
    }
    this.mounted = false;
    this.hasData = false;
    this.rawData = null;
    this.logger.debug('ui.destroyed');
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { indexReady: true } }; }

export default UIComponent;
