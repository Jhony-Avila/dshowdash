// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-13:ui:component
// PURPOSE: UIComponent - Panel-13 SLA e Disponibilidade
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
import { DrawerComponent } from './drawer.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-13:ui:component';

const ICONS = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement, logger: Record<string, unknown>) {
    this.container = container;
    this.logger = logger;
    this.mounted = false;
    this.hasData = false;
    this.toastManager = null;
    this.availability = null;
    this.jobsSla = [];
    this.criticalJobs = [];
    this.summary = null;
    this.period = null;
  }

  async init() {
    if (!this.container) return;
    this.toastManager = new ToastManager();
    this.drawerComponent = new (DrawerComponent as unknown as new (logger: Record<string, unknown>, options: Record<string, unknown>) => Record<string, unknown>)(this.logger, {});
    this.keyboardNav = new (KeyboardNavigation as unknown as new (container: HTMLElement, options: Record<string, unknown>) => Record<string, unknown>)(this.container, {});
    this._setupListeners();
    this.mounted = true;
  }

  _setupListeners() { this.container.addEventListener('click', (e: MouseEvent) => this._handleClick(e)); }
  _handleClick(e: MouseEvent) { const t = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null; if (!t) return; if (t.dataset.action === 'export-sla') this._exportSla(); if (t.dataset.action === 'export-critical') this._exportCritical(); }

  showLoading() { if (this.hasData) { this.container.classList.add('p13-loading-overlay'); return; } this.container.innerHTML = renderSkeleton(); }
  hideLoading() { this.container.classList.remove('p13-loading-overlay'); }
  showError(msg: string) { if (!this.hasData) this.container.innerHTML = renderError(msg); else this.toastManager?.error(msg); this.hideLoading(); }
  showEmpty() { this.container.innerHTML = renderEmpty(); }

  update(data: Record<string, unknown>) {
    if (!this.container) return;
    this.hideLoading();
    try {
      const p = (data?.data || data?.payload || data) as Record<string, unknown>;
      this.availability = (p?.availability || {}) as Record<string, unknown>;
      this.jobsSla = (p?.jobs_sla || []) as Record<string, unknown>[];
      this.criticalJobs = (p?.critical_jobs || []) as Record<string, unknown>[];
      this.summary = (p?.summary || {}) as Record<string, unknown>;
      this.period = (p?.period || {}) as Record<string, unknown>;
      if (!this.availability.total_executions) { this.showEmpty(); return; }
      this._renderDashboard();
      this.hasData = true;
    } catch (err) { this.showError('Erro ao renderizar'); }
  }

  _renderDashboard() {
    const a = this.availability;
    const s = this.summary;
    const statusClass = a.uptime_status === 'excellent' ? 'p13-kpi-icon--success' : a.uptime_status === 'good' ? 'p13-kpi-icon--info' : 'p13-kpi-icon--warning';
    
    this.container.innerHTML = `
      <div class="p13-dashboard">
        <div class="p13-kpi-grid">
          <div class="p13-kpi-card p13-kpi-card--large">
            <div class="p13-kpi-icon ${statusClass}">${ICONS.shield}</div>
            <div class="p13-kpi-content">
              <span class="p13-kpi-value">${(a.availability_percent || 0).toFixed(2)}%</span>
              <span class="p13-kpi-label">Disponibilidade (${this.period?.days || 30}d)</span>
            </div>
          </div>
          <div class="p13-kpi-card">
            <div class="p13-kpi-icon p13-kpi-icon--primary">${ICONS.check}</div>
            <div class="p13-kpi-content">
              <span class="p13-kpi-value">${this._formatNumber(a.successful)}</span>
              <span class="p13-kpi-label">Sucesso</span>
            </div>
          </div>
          <div class="p13-kpi-card">
            <div class="p13-kpi-icon p13-kpi-icon--error">${ICONS.x}</div>
            <div class="p13-kpi-content">
              <span class="p13-kpi-value">${this._formatNumber(a.failed)}</span>
              <span class="p13-kpi-label">Falhas</span>
            </div>
          </div>
        </div>
        ${this._renderSummaryBar()}
        <div class="p13-tables-grid">
          ${this._renderSlaTable()}
          ${this._renderCriticalTable()}
        </div>
      </div>
    `;
  }

  _renderSummaryBar() {
    const s = this.summary;
    return `<div class="p13-summary-bar"><span class="p13-summary-item p13-summary--excellent">${ICONS.trophy} Excelentes: ${s.excellent_jobs || 0}</span><span class="p13-summary-item p13-summary--good">${ICONS.check} Bons: ${s.good_jobs || 0}</span><span class="p13-summary-item p13-summary--warning">${ICONS.alert} Atenção: ${s.warning_jobs || 0}</span><span class="p13-summary-item p13-summary--critical">${ICONS.x} Críticos: ${s.critical_jobs || 0}</span></div>`;
  }

  _renderSlaTable() {
    const rows = this.jobsSla.slice(0, 15).map((j: Record<string, unknown>) => {
      const statusClass = j.status === 'excellent' ? 'p13-status--success' : j.status === 'good' ? 'p13-status--info' : j.status === 'warning' ? 'p13-status--warning' : 'p13-status--error';
      return `<tr class="p13-tr"><td class="p13-td">${this._escape(j.job_name)}</td><td class="p13-td">${j.job_type || '--'}</td><td class="p13-td"><span class="p13-rate ${statusClass}">${(j.success_rate as number | undefined)?.toFixed(1)}%</span></td><td class="p13-td">${this._formatNumber(j.total_executions)}</td><td class="p13-td">${this._formatDuration(j.avg_execution_time)}</td></tr>`;
    }).join('') || '<tr><td colspan="5" class="p13-empty-table">Nenhum job</td></tr>';
    return `<div class="p13-section"><div class="p13-section-header"><h3 class="p13-section-title">${ICONS.trophy} <span>Jobs por SLA</span></h3><button class="p13-btn-icon" data-action="export-sla">${ICONS.download}</button></div><div class="p13-section-body"><table class="p13-table"><thead><tr><th class="p13-th">Job</th><th class="p13-th">Tipo</th><th class="p13-th">Taxa</th><th class="p13-th">Execuções</th><th class="p13-th">Tempo Médio</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  _renderCriticalTable() {
    const rows = this.criticalJobs.map((j: Record<string, unknown>) => `<tr class="p13-tr"><td class="p13-td">${this._escape(j.job_name)}</td><td class="p13-td"><span class="p13-badge p13-badge--error">${j.error_count}</span></td><td class="p13-td">${this._formatDateTime(j.last_error)}</td></tr>`).join('') || '<tr><td colspan="3" class="p13-empty-table">Nenhum job crítico</td></tr>';
    return `<div class="p13-section"><div class="p13-section-header"><h3 class="p13-section-title">${ICONS.alert} <span>Jobs Críticos (7d)</span></h3><button class="p13-btn-icon" data-action="export-critical">${ICONS.download}</button></div><div class="p13-section-body"><table class="p13-table"><thead><tr><th class="p13-th">Job</th><th class="p13-th">Erros</th><th class="p13-th">Último Erro</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  _exportSla() { if (!this.jobsSla.length) { this.toastManager?.warning('Nenhum dado'); return; } const rows = this.jobsSla.map((j: Record<string, unknown>) => [j.job_name, j.job_type, j.success_rate, j.total_executions, j.avg_execution_time]); this._downloadCSV(['Job', 'Tipo', 'Taxa (%)', 'Execuções', 'Tempo Médio'], rows, 'sla-jobs'); this.toastManager?.success('Exportado'); }
  _exportCritical() { if (!this.criticalJobs.length) { this.toastManager?.warning('Nenhum dado'); return; } const rows = this.criticalJobs.map((j: Record<string, unknown>) => [j.job_name, j.error_count, j.last_error]); this._downloadCSV(['Job', 'Erros', 'Último Erro'], rows, 'jobs-criticos'); this.toastManager?.success('Exportado'); }

  _downloadCSV(headers: string[], rows: unknown[][], filename: string) { const csv = [headers.join(';'), ...rows.map((r: unknown[]) => r.map((v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n'); const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url); }

  _formatNumber(v: unknown) { if (v == null) return '--'; return parseInt(String(v)).toLocaleString('pt-BR'); }
  _formatDuration(s: unknown) { if (s == null) return '--'; const n = parseFloat(String(s)); if (isNaN(n)) return String(s); if (n < 60) return `${n.toFixed(1)}s`; return `${(n / 60).toFixed(1)}min`; }
  _formatDateTime(d: unknown) { if (!d) return '--'; try { return new Date(String(d)).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return String(d); } }
  _escape(s: unknown) { const map: Record<string, string> = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}; return String(s || '').replace(/[&<>"']/g, (m: string) => map[m]); }

  async destroy() { this.keyboardNav?.destroy(); this.drawerComponent?.destroy(); this.container && (this.container.innerHTML = ''); this.mounted = false; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
  info() { return { moduleId: MODULE_ID, version: VERSION }; }
}

export default UIComponent;
