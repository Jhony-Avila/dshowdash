// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-07:ui:component
// PURPOSE: UIComponent - Panel-07 Procedures em Execução
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
export const MODULE_ID = 'panel-07:ui:component';

const ICONS = {
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
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
    this.keyboardNav = null;
    this.drawerComponent = null;
    this.running = [];
    this.recentCompleted = [];
    this.statistics = null;
  }

  async init() {
    if (!this.container) return;
    this.toastManager = new ToastManager();
    this.drawerComponent = new (DrawerComponent as unknown as new (...args: unknown[]) => unknown)(this.logger, {});
    this.keyboardNav = new (KeyboardNavigation as unknown as new (...args: unknown[]) => unknown)(this.container, {});
    this._setupListeners();
    this.mounted = true;
  }

  _setupListeners() {
    this.container.addEventListener('click', (e: MouseEvent) => this._handleClick(e));
  }

  _handleClick(e: MouseEvent) {
    const target = (e.target as HTMLElement)?.closest('[data-action]') as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'export-running') this._exportRunning();
    if (action === 'export-recent') this._exportRecent();
  }

  showLoading() {
    if (this.hasData) { this.container.classList.add('p07-loading-overlay'); return; }
    this.container.innerHTML = renderSkeleton();
  }

  hideLoading() { this.container.classList.remove('p07-loading-overlay'); }
  showError(msg: string) { if (!this.hasData) this.container.innerHTML = renderError(msg); else this.toastManager?.error(msg); this.hideLoading(); }
  showEmpty() { this.container.innerHTML = renderEmpty(); }

  update(data: Record<string, unknown>) {
    if (!this.container) return;
    this.hideLoading();
    try {
      const payload = (data?.data || data?.payload || data) as Record<string, unknown>;
      this.running = (payload?.running as unknown[]) || [];
      this.recentCompleted = (payload?.recent_completed as unknown[]) || [];
      this.statistics = (payload?.statistics as Record<string, unknown>) || {};
      if (!this.running.length && !this.recentCompleted.length) { this.showEmpty(); return; }
      this._renderDashboard();
      this.hasData = true;
    } catch (err) { this.showError('Erro ao renderizar'); }
  }

  _renderDashboard() {
    const s = this.statistics || {};
    this.container.innerHTML = `
      <div class="p07-dashboard">
        <div class="p07-kpi-grid">
          <div class="p07-kpi-card">
            <div class="p07-kpi-icon p07-kpi-icon--primary">${ICONS.play}</div>
            <div class="p07-kpi-content">
              <span class="p07-kpi-value">${s.total_running || 0}</span>
              <span class="p07-kpi-label">Em Execução</span>
            </div>
          </div>
          <div class="p07-kpi-card">
            <div class="p07-kpi-icon p07-kpi-icon--success">${ICONS.check}</div>
            <div class="p07-kpi-content">
              <span class="p07-kpi-value">${s.normal_jobs || 0}</span>
              <span class="p07-kpi-label">Normal</span>
            </div>
          </div>
          <div class="p07-kpi-card">
            <div class="p07-kpi-icon p07-kpi-icon--warning">${ICONS.alert}</div>
            <div class="p07-kpi-content">
              <span class="p07-kpi-value">${s.slow_jobs || 0}</span>
              <span class="p07-kpi-label">Lentos</span>
            </div>
          </div>
        </div>
        <div class="p07-tables-grid">
          ${this._renderRunningSection()}
          ${this._renderRecentSection()}
        </div>
      </div>
    `;
  }

  _renderRunningSection() {
    const rows = (this.running as Record<string, unknown>[]).map((j: Record<string, unknown>) => {
      const statusClass = j.status === 'slow' ? 'p07-status--warning' : 'p07-status--success';
      return `<tr class="p07-tr"><td class="p07-td">${this._escape(j.job_name)}</td><td class="p07-td">${j.job_type || '--'}</td><td class="p07-td"><span class="${statusClass}">${j.status}</span></td><td class="p07-td">${this._formatDuration(j.running_for_seconds)}</td><td class="p07-td">${this._formatDuration(j.avg_execution_time)}</td></tr>`;
    }).join('') || '<tr><td colspan="5" class="p07-empty-table">Nenhum job em execução</td></tr>';
    return `<div class="p07-section"><div class="p07-section-header"><h3 class="p07-section-title">${ICONS.play} <span>Em Execução</span></h3><button class="p07-btn-icon" data-action="export-running">${ICONS.download}</button></div><div class="p07-section-body"><table class="p07-table"><thead><tr><th class="p07-th">Job</th><th class="p07-th">Tipo</th><th class="p07-th">Status</th><th class="p07-th">Tempo</th><th class="p07-th">Média</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  _renderRecentSection() {
    const rows = (this.recentCompleted as Record<string, unknown>[]).map((j: Record<string, unknown>) => {
      const statusClass = j.status === 'success' ? 'p07-status--success' : 'p07-status--error';
      return `<tr class="p07-tr"><td class="p07-td">${this._escape(j.job_name)}</td><td class="p07-td"><span class="${statusClass}">${j.status}</span></td><td class="p07-td">${this._formatDuration(j.duration)}</td><td class="p07-td">${j.rows_affected}</td><td class="p07-td">${this._formatTime(j.finished_at)}</td></tr>`;
    }).join('') || '<tr><td colspan="5" class="p07-empty-table">Nenhuma execução recente</td></tr>';
    return `<div class="p07-section"><div class="p07-section-header"><h3 class="p07-section-title">${ICONS.activity} <span>Recentes (5 min)</span></h3><button class="p07-btn-icon" data-action="export-recent">${ICONS.download}</button></div><div class="p07-section-body"><table class="p07-table"><thead><tr><th class="p07-th">Job</th><th class="p07-th">Status</th><th class="p07-th">Duração</th><th class="p07-th">Rows</th><th class="p07-th">Fim</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  _exportRunning() {
    if (!(this.running as unknown[]).length) { this.toastManager?.warning('Nenhum dado'); return; }
    const rows = (this.running as Record<string, unknown>[]).map((j: Record<string, unknown>) => [j.job_name, j.job_type, j.status, j.running_for_seconds, j.avg_execution_time]);
    this._downloadCSV(['Job', 'Tipo', 'Status', 'Tempo (s)', 'Média (s)'], rows, 'jobs-em-execucao');
    this.toastManager?.success('Exportado');
  }

  _exportRecent() {
    if (!(this.recentCompleted as unknown[]).length) { this.toastManager?.warning('Nenhum dado'); return; }
    const rows = (this.recentCompleted as Record<string, unknown>[]).map((j: Record<string, unknown>) => [j.job_name, j.status, j.duration, j.rows_affected, j.finished_at]);
    this._downloadCSV(['Job', 'Status', 'Duração', 'Rows', 'Fim'], rows, 'execucoes-recentes');
    this.toastManager?.success('Exportado');
  }

  _downloadCSV(headers: string[], rows: unknown[][], filename: string) {
    const csv = [headers.join(';'), ...rows.map((r: unknown[]) => r.map((v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click(); URL.revokeObjectURL(url);
  }

  _formatDuration(s: unknown) { if (s == null) return '--'; const n = parseFloat(String(s)); if (isNaN(n)) return String(s); if (n < 60) return `${n.toFixed(1)}s`; return `${(n / 60).toFixed(1)}min`; }
  _formatTime(d: unknown) { if (!d) return '--'; try { return new Date(String(d)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch { return String(d); } }
  _escape(s: unknown) { const map: Record<string, string> = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}; return String(s || '').replace(/[&<>"']/g, m => map[m]); }

  async destroy() { this.keyboardNav?.destroy(); this.drawerComponent?.destroy(); this.container && (this.container.innerHTML = ''); this.mounted = false; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
  info() { return { moduleId: MODULE_ID, version: VERSION }; }
}

export default UIComponent;
