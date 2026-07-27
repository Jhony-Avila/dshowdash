// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-18:ui:component
// PURPOSE: UIComponent - Panel-18 KPIs Taxa de Sucesso
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderSkeleton from ./render/skeleton.js
//   renderEmpty from ./render/empty.js
//   renderError from ./render/error.js
//   ToastManager from ./toast.js
//   KeyboardNavigation from ./keyboard.js
//   DrawerComponent from ./drawer.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { renderSkeleton } from './render/skeleton.js';
import { renderEmpty } from './render/empty.js';
import { renderError } from './render/error.js';
import { ToastManager } from './toast.js';
import { KeyboardNavigation } from './keyboard.js';

// @ts-expect-error TS migration - TS2614
import { DrawerComponent } from './drawer.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-18:ui:component';

const ICONS = {
  percent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>'
};

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement, logger: Record<string, unknown>) {
    this.container = container;
    this.logger = logger;
    this.mounted = false;
    this.hasData = false;
    this.toastManager = null;
    this.keyboardNav = null;
    this.drawerComponent = null;
    this.availability = null;
    this.jobsSla = [];
    this.criticalJobs = [];
    this.summary = null;
    this.period = null;
  }

  async init() {
    if (!this.container) return;
    this.toastManager = new ToastManager();
    this.drawerComponent = new (DrawerComponent as unknown as new (logger: unknown, opts: Record<string, unknown>) => Record<string, unknown>)(this.logger, {});
    this.keyboardNav = new (KeyboardNavigation as unknown as new (container: HTMLElement, opts: Record<string, unknown>) => Record<string, unknown>)(this.container, {});
    this._setupListeners();
    this.mounted = true;
  }

  _setupListeners() {
    this.container.addEventListener('click', (e: Event) => this._handleClick(e));
  }

  _handleClick(e: Event) {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'export-jobs') this._exportJobs();
  }

  showLoading() {
    if (this.hasData) { this.container.classList.add('p18-loading-overlay'); return; }
    this.container.innerHTML = renderSkeleton();
  }

  hideLoading() { this.container.classList.remove('p18-loading-overlay'); }

  showError(msg: string) {
    if (!this.hasData) this.container.innerHTML = renderError(msg);
    else this.toastManager?.error(msg);
    this.hideLoading();
  }

  showEmpty() { this.container.innerHTML = renderEmpty(); }

  update(data: Record<string, unknown>) {
    if (!this.container) return;
    this.hideLoading();
    try {
      const p = (data?.data || data?.payload || data) as Record<string, unknown>;
      this.availability = (p?.availability as Record<string, unknown>) || {};
      this.jobsSla = (p?.jobs_sla as Record<string, unknown>[]) || [];
      this.criticalJobs = (p?.critical_jobs as Record<string, unknown>[]) || [];
      this.summary = (p?.summary as Record<string, unknown>) || {};
      this.period = (p?.period as Record<string, unknown>) || {};
      if (!this.availability.total_executions) { this.showEmpty(); return; }
      this._renderDashboard();
      this.hasData = true;
    } catch (err: any) {
      this.logger?.error('render-failed', { error: err.message });
      this.showError('Erro ao renderizar dashboard');
    }
  }

  _renderDashboard() {
    const a = this.availability;
    const s = this.summary || {};
    const days = this.period?.days || 30;

    // Determinar classes de status
    const uptimeClass = a.uptime_status === 'excellent' ? 'p18-kpi--excellent' : 
                        a.uptime_status === 'good' ? 'p18-kpi--good' : 'p18-kpi--poor';
    const uptimeIcon = a.uptime_status === 'excellent' ? ICONS.trophy : 
                       a.uptime_status === 'good' ? ICONS.check : ICONS.alert;

    this.container.innerHTML = `
      <div class="p18-dashboard">
        <div class="p18-period-badge">
          <span>Período: ${this.period?.from || '--'} até ${this.period?.to || '--'} (${days} dias)</span>
        </div>
        
        <div class="p18-kpi-grid-2x2">
          <div class="p18-kpi-large ${uptimeClass}">
            <div class="p18-kpi-large-header">
              <span class="p18-kpi-large-icon">${ICONS.percent}</span>
              <span class="p18-kpi-large-title">Taxa de Sucesso</span>
            </div>
            <div class="p18-kpi-large-value">${(a.availability_percent || 0).toFixed(2)}%</div>
            <div class="p18-kpi-large-footer">
              <span class="p18-kpi-large-status">${uptimeIcon} ${this._getStatusText(a.uptime_status)}</span>
            </div>
          </div>
          
          <div class="p18-kpi-large p18-kpi--primary">
            <div class="p18-kpi-large-header">
              <span class="p18-kpi-large-icon">${ICONS.activity}</span>
              <span class="p18-kpi-large-title">Total Execuções</span>
            </div>
            <div class="p18-kpi-large-value">${this._formatNumber(a.total_executions)}</div>
            <div class="p18-kpi-large-footer">
              <span class="p18-kpi-large-meta">${Math.round(a.total_executions / days)}/dia</span>
            </div>
          </div>
          
          <div class="p18-kpi-large p18-kpi--success">
            <div class="p18-kpi-large-header">
              <span class="p18-kpi-large-icon">${ICONS.check}</span>
              <span class="p18-kpi-large-title">Sucesso</span>
            </div>
            <div class="p18-kpi-large-value">${this._formatNumber(a.successful)}</div>
            <div class="p18-kpi-large-footer">
              <span class="p18-kpi-large-trend p18-trend--up">${ICONS.arrowUp} ${((a.successful / a.total_executions) * 100).toFixed(1)}%</span>
            </div>
          </div>
          
          <div class="p18-kpi-large p18-kpi--error">
            <div class="p18-kpi-large-header">
              <span class="p18-kpi-large-icon">${ICONS.x}</span>
              <span class="p18-kpi-large-title">Falhas</span>
            </div>
            <div class="p18-kpi-large-value">${this._formatNumber(a.failed)}</div>
            <div class="p18-kpi-large-footer">
              <span class="p18-kpi-large-trend p18-trend--down">${ICONS.arrowDown} ${((a.failed / a.total_executions) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        ${this._renderSummaryBar()}
        ${this._renderTopJobsTable()}
      </div>
    `;
  }

  _getStatusText(status: string) {
    const map: Record<string, string> = { 'excellent': 'Excelente', 'good': 'Bom', 'poor': 'Atenção' };
    return map[status] || status || '--';
  }

  _renderSummaryBar() {
    const s = this.summary;
    if (!s) return '';
    return `
      <div class="p18-summary-bar">
        <div class="p18-summary-item p18-summary--excellent">
          ${ICONS.trophy}
          <span class="p18-summary-label">Excelentes</span>
          <span class="p18-summary-value">${s.excellent_jobs || 0}</span>
        </div>
        <div class="p18-summary-item p18-summary--good">
          ${ICONS.check}
          <span class="p18-summary-label">Bons</span>
          <span class="p18-summary-value">${s.good_jobs || 0}</span>
        </div>
        <div class="p18-summary-item p18-summary--warning">
          ${ICONS.alert}
          <span class="p18-summary-label">Atenção</span>
          <span class="p18-summary-value">${s.warning_jobs || 0}</span>
        </div>
        <div class="p18-summary-item p18-summary--critical">
          ${ICONS.x}
          <span class="p18-summary-label">Críticos</span>
          <span class="p18-summary-value">${s.critical_jobs || 0}</span>
        </div>
      </div>
    `;
  }

  _renderTopJobsTable() {
    const jobs = this.jobsSla.slice(0, 10);
    if (!jobs.length) return '';

    const rows = jobs.map((j: Record<string, unknown>, i: number) => {
      const statusClass = j.status === 'excellent' ? 'p18-status--excellent' : 
                          j.status === 'good' ? 'p18-status--good' : 
                          j.status === 'warning' ? 'p18-status--warning' : 'p18-status--critical';
      const statusIcon = j.status === 'excellent' ? ICONS.trophy : 
                         j.status === 'good' ? ICONS.check : 
                         j.status === 'warning' ? ICONS.alert : ICONS.x;
      return `
        <tr class="p18-tr">
          <td class="p18-td p18-td--rank">#${i + 1}</td>
          <td class="p18-td p18-td--name">${this._escape(j.job_name)}</td>
          <td class="p18-td p18-td--type">${j.job_type || '--'}</td>
          <td class="p18-td p18-td--rate">
            <span class="p18-rate-badge ${statusClass}">${(j.success_rate as number | undefined)?.toFixed(1)}%</span>
          </td>
          <td class="p18-td p18-td--exec">${this._formatNumber(j.total_executions)}</td>
          <td class="p18-td p18-td--time">${this._formatDuration(j.avg_execution_time)}</td>
          <td class="p18-td p18-td--status">
            <span class="p18-status-icon ${statusClass}">${statusIcon}</span>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="p18-section">
        <div class="p18-section-header">
          <h3 class="p18-section-title">${ICONS.trophy} <span>Top Jobs por Performance</span></h3>
          <button class="p18-btn-icon" data-action="export-jobs" title="Exportar CSV">${ICONS.download}</button>
        </div>
        <div class="p18-section-body">
          <table class="p18-table">
            <thead>
              <tr>
                <th class="p18-th">#</th>
                <th class="p18-th">Job</th>
                <th class="p18-th">Tipo</th>
                <th class="p18-th">Taxa</th>
                <th class="p18-th">Execuções</th>
                <th class="p18-th">Tempo Médio</th>
                <th class="p18-th">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  _exportJobs() {
    if (!this.jobsSla.length) {
      this.toastManager?.warning('Nenhum dado para exportar');
      return;
    }
    const headers = ['#', 'Job', 'Tipo', 'Taxa (%)', 'Execuções', 'Tempo Médio', 'Status'];
    const rows = this.jobsSla.map((j: Record<string, unknown>, i: number) => [
      i + 1, j.job_name, j.job_type, j.success_rate, j.total_executions, j.avg_execution_time, j.status
    ]);
    this._downloadCSV(headers, rows, 'kpis-taxa-sucesso');
    this.toastManager?.success('Exportado com sucesso');
  }

  _downloadCSV(headers: string[], rows: unknown[][], filename: string) {
    const csv = [
      headers.join(';'),
      ...rows.map((r: unknown[]) => r.map((v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    ].join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  _formatNumber(v: unknown) {
    if (v == null) return '--';
    return parseInt(String(v)).toLocaleString('pt-BR');
  }

  _formatDuration(s: unknown) {
    if (s == null) return '--';
    const n = parseFloat(String(s));
    if (isNaN(n)) return String(s);
    if (n < 60) return `${n.toFixed(1)}s`;
    return `${(n / 60).toFixed(1)}min`;
  }

  _escape(s: unknown) {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(s || '').replace(/[&<>"']/g, (m: string) => map[m]);
  }

  async destroy() {
    this.keyboardNav?.destroy();
    this.drawerComponent?.destroy();
    this.container && (this.container.innerHTML = '');
    this.mounted = false;
  }

  healthCheck() {
    return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
  }

  info() {
    return { moduleId: MODULE_ID, version: VERSION };
  }
}

export default UIComponent;
