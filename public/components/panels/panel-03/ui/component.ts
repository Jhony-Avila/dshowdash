// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-03:ui:component
// PURPOSE: UIComponent - Panel-03 Execuções por Hora
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderSkeleton from ./render/skeleton.js
//   renderEmpty from ./render/empty.js
//   renderError from ./render/error.js
//   ToastManager from ./toast.js
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-03:ui:component';

const ICONS = {
  barChart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  percent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement | null, logger: Record<string, unknown>) {
    this.container = container;
    this.logger = logger;
    this.mounted = false;
    this.hasData = false;
    this.toastManager = null;
    this.hourly = [];
    this.period = {};
  }

  async init() {
    if (!this.container) return;
    this.toastManager = new ToastManager();
    this._setupListeners();
    this.mounted = true;
  }

  _setupListeners() { this.container.addEventListener('click', (e: MouseEvent) => this._handleClick(e)); }
  _handleClick(e: MouseEvent) { const t = (e.target as HTMLElement).closest('[data-action]'); if (!t) return; if ((t as HTMLElement).dataset.action === 'export') this._export(); }

  showLoading() { if (this.hasData) { this.container.classList.add('p03-loading-overlay'); return; } this.container.innerHTML = renderSkeleton(); }
  hideLoading() { this.container.classList.remove('p03-loading-overlay'); }
  showError(msg: string) { if (!this.hasData) this.container.innerHTML = renderError(msg); else this.toastManager?.error(msg); this.hideLoading(); }
  showEmpty() { this.container.innerHTML = renderEmpty(); }

  update(data: Record<string, unknown>) {
    if (!this.container) return;
    this.hideLoading();
    try {
      const p = (data?.data || data?.payload || data) as Record<string, unknown>;
      this.hourly = (p?.hourly || []) as Record<string, unknown>[];
      this.period = (p?.period || {}) as Record<string, unknown>;
      if (!this.hourly.length) { this.showEmpty(); return; }
      this._renderDashboard();
      this.hasData = true;
    } catch (err) { this.showError('Erro ao renderizar'); }
  }

  _renderDashboard() {
    const p = this.period;
    this.container.innerHTML = `
      <div class="p03-dashboard">
        <div class="p03-kpi-grid">
          <div class="p03-kpi-card">
            <div class="p03-kpi-icon p03-kpi-icon--primary">${ICONS.activity}</div>
            <div class="p03-kpi-content">
              <span class="p03-kpi-value">${this._formatNumber(p.total_executions)}</span>
              <span class="p03-kpi-label">Total (${p.hours || 24}h)</span>
            </div>
          </div>
          <div class="p03-kpi-card">
            <div class="p03-kpi-icon p03-kpi-icon--success">${ICONS.check}</div>
            <div class="p03-kpi-content">
              <span class="p03-kpi-value">${this._formatNumber(p.total_success)}</span>
              <span class="p03-kpi-label">Sucesso</span>
            </div>
          </div>
          <div class="p03-kpi-card">
            <div class="p03-kpi-icon p03-kpi-icon--error">${ICONS.x}</div>
            <div class="p03-kpi-content">
              <span class="p03-kpi-value">${this._formatNumber(p.total_errors)}</span>
              <span class="p03-kpi-label">Erros</span>
            </div>
          </div>
          <div class="p03-kpi-card">
            <div class="p03-kpi-icon p03-kpi-icon--info">${ICONS.percent}</div>
            <div class="p03-kpi-content">
              <span class="p03-kpi-value">${(p.overall_success_rate || 0).toFixed(1)}%</span>
              <span class="p03-kpi-label">Taxa de Sucesso</span>
            </div>
          </div>
        </div>
        <div class="p03-chart-section">
          <div class="p03-section-header">
            <h3 class="p03-section-title">${ICONS.barChart} <span>Execuções por Hora</span></h3>
            <button class="p03-btn-icon" data-action="export">${ICONS.download}</button>
          </div>
          <div class="p03-chart-container">${this._renderChart()}</div>
        </div>
        <div class="p03-table-section">${this._renderTable()}</div>
      </div>
    `;
  }

  _renderChart() {
    if (!this.hourly.length) return '<div class="p03-empty">Sem dados</div>';
    const max = Math.max(...this.hourly.map((h: Record<string, unknown>) => h.total as number));
    const bars = this.hourly.slice(0, 24).map((h: Record<string, unknown>) => {
      const total = h.total as number;
      const pct = max > 0 ? (total / max) * 100 : 0;
      const hour = (h.hour as string).split(' ')[1]?.slice(0, 5) || (h.hour as string).slice(11, 16);
      return `<div class="p03-bar-group"><div class="p03-bar" style="height:${pct}%" title="${total} execuções"><div class="p03-bar-success" style="height:${h.success_rate}%"></div></div><span class="p03-bar-label">${hour}</span></div>`;
    }).join('');
    return `<div class="p03-bar-chart">${bars}</div>`;
  }

  _renderTable() {
    const rows = this.hourly.slice(0, 12).map((h: Record<string, unknown>) => {
      const rate = h.success_rate as number;
      const rateClass = rate >= 95 ? 'p03-rate--high' : rate >= 80 ? 'p03-rate--medium' : 'p03-rate--low';
      return `<tr class="p03-tr"><td class="p03-td">${this._formatHour(h.hour as string)}</td><td class="p03-td">${h.total}</td><td class="p03-td p03-td--success">${h.success}</td><td class="p03-td p03-td--error">${h.errors}</td><td class="p03-td"><span class="p03-rate ${rateClass}">${rate}%</span></td><td class="p03-td">${(h.avg_time as number)?.toFixed(1)}s</td></tr>`;
    }).join('');
    return `<div class="p03-section"><div class="p03-section-body"><table class="p03-table"><thead><tr><th class="p03-th">Hora</th><th class="p03-th">Total</th><th class="p03-th">OK</th><th class="p03-th">Erro</th><th class="p03-th">Taxa</th><th class="p03-th">Tempo</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  _export() { if (!this.hourly.length) { this.toastManager?.warning('Nenhum dado'); return; } const rows = this.hourly.map((h: Record<string, unknown>) => [h.hour, h.total, h.success, h.errors, h.success_rate, h.avg_time]); this._downloadCSV(['Hora', 'Total', 'Sucesso', 'Erros', 'Taxa (%)', 'Tempo Médio'], rows, 'execucoes-por-hora'); this.toastManager?.success('Exportado'); }

  _downloadCSV(headers: string[], rows: unknown[][], filename: string) { const csv = [headers.join(';'), ...rows.map((r: unknown[]) => r.map((v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n'); const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url); }

  _formatNumber(v: unknown) { if (v == null) return '--'; return parseInt(String(v)).toLocaleString('pt-BR'); }
  _formatHour(h: string) { if (!h) return '--'; return h.split(' ')[1]?.slice(0, 5) || h.slice(11, 16); }

  async destroy() { this.container && (this.container.innerHTML = ''); this.mounted = false; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
  info() { return { moduleId: MODULE_ID, version: VERSION }; }
}

export default UIComponent;
