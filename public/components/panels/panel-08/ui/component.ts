// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-08-ui-component
// PURPOSE: Panel-08 UIComponent Anti-Flicker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
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

const SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement | null, logger: Record<string, ((...args: unknown[]) => void) | undefined> | null) { this.container = container; this.logger = logger; this.mounted = false; this.hasData = false; this._lastDataHash = null; this._lastTimestamp = null; }

  async init() { if (!this.container) { this.logger?.error?.('ui.no-container'); return; } this.mounted = true; this.logger?.debug?.('ui.init'); }

  _hashData(data: unknown) { if (!data) return null; try { return JSON.stringify(data); } catch (e) { return null; } }

  showLoading() {
    if (!this.container) return;
    if (this.hasData) { this.logger?.debug?.('ui.loading-skipped', { reason: 'has-data' }); return; }
    this.container.innerHTML = '<div class="p08-skeleton"><div class="p08-skeleton-header"><div class="p08-skeleton-line p08-skeleton-line--title"></div></div><div class="p08-skeleton-grid"><div class="p08-skeleton-card"></div><div class="p08-skeleton-card"></div><div class="p08-skeleton-card"></div><div class="p08-skeleton-card"></div></div><div class="p08-skeleton-list"><div class="p08-skeleton-line"></div><div class="p08-skeleton-line"></div><div class="p08-skeleton-line"></div><div class="p08-skeleton-line"></div><div class="p08-skeleton-line"></div></div></div>';
    this.logger?.debug?.('ui.loading-skeleton');
  }

  hideLoading() { if (!this.container) return; this.container.classList.remove('p08-loading-overlay'); }

  showError(message: string) {
    if (!this.container) return;
    if (this.hasData) { this._showErrorBadge(message); return; }
    this.container.innerHTML = `<div class="p08-error"><svg class="p08-error-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p class="p08-error-message">${this._escapeHtml(message || 'Erro ao carregar dados')}</p><button class="p08-error-retry" data-action="retry">Tentar novamente</button></div>`;
    this.logger?.debug?.('ui.error-full', { message });
  }

  _showErrorBadge(message: string) {
    const existingBadge = this.container.querySelector('.p08-error-badge');
    if (existingBadge) existingBadge.remove();
    const badge = document.createElement('div');
    badge.className = 'p08-error-badge';
    badge.innerHTML = `<span class="p08-error-badge-icon">${SVGS.warning}</span> ${this._escapeHtml(message || 'Erro ao atualizar')}`;
    this.container.insertBefore(badge, this.container.firstChild);
    setTimeout(() => { badge.remove(); }, 5000);
    this.logger?.debug?.('ui.error-badge', { message });
  }

  update(data: Record<string, unknown>) {
    if (!this.container) return;
    this.hideLoading();
    this.container.classList.remove('p08-has-error');
    const newHash = this._hashData(data);
    if (newHash === this._lastDataHash && this.hasData) { this._updateTimestampOnly(); this.logger?.debug?.('ui.update-skipped', { reason: 'data-unchanged' }); return; }
    this._lastDataHash = newHash;
    this._lastTimestamp = Date.now();
    try {
      const inner = data?.data as Record<string, unknown> | unknown[] | null | undefined;
      if (Array.isArray(inner)) { this._renderAlertsList(inner as Record<string, unknown>[], (data.meta as Record<string, unknown>) || {}); }
      else if (inner && typeof inner === 'object' && (inner as Record<string, unknown>).overview) { this._renderJobsPanel(inner as Record<string, unknown>); }
      else if (inner && typeof inner === 'object') { this._renderMetricsCards(inner as Record<string, unknown>); }
      else { this._renderGenericData(data); }
      this.hasData = true;
      this.logger?.debug?.('ui.render-success');
    } catch (error) { this.logger?.error?.('ui.render-error', { error: (error as Error).message }); this.showError('Erro ao renderizar dados'); }
  }

  _updateTimestampOnly() { const timestampEl = this.container.querySelector('[data-timestamp]'); if (timestampEl) { timestampEl.textContent = this._formatTime(Date.now()); } }

  _renderAlertsList(alerts: Record<string, unknown>[], meta: Record<string, unknown>) {
    const self = this;
    meta = meta || {};
    const count = alerts?.length || 0;
    const errorCount = alerts?.filter(a => a.alert_type === 'ERROR').length || 0;
    const warningCount = alerts?.filter(a => a.alert_type === 'WARNING').length || 0;
    this.container.innerHTML = `<div class="p08-alerts"><div class="p08-alerts-summary"><div class="p08-summary-card p08-summary-card--total"><span class="p08-summary-value">${count}</span><span class="p08-summary-label">Total</span></div><div class="p08-summary-card p08-summary-card--error"><span class="p08-summary-value">${errorCount}</span><span class="p08-summary-label">Erros</span></div><div class="p08-summary-card p08-summary-card--warning"><span class="p08-summary-value">${warningCount}</span><span class="p08-summary-label">Avisos</span></div><div class="p08-summary-card p08-summary-card--period"><span class="p08-summary-value">${meta?.period || '24h'}</span><span class="p08-summary-label">Período</span></div></div><div class="p08-alerts-list">${alerts.slice(0, 10).map((alert: Record<string, unknown>) => { const alertType = String(alert.alert_type || 'info'); const alertSeverity = String(alert.severity || 'low'); return `<div class="p08-alert-item p08-alert-item--${alertType.toLowerCase()}"><div class="p08-alert-icon">${alertType === 'ERROR' ? SVGS.x : alertType === 'WARNING' ? SVGS.warning : SVGS.info}</div><div class="p08-alert-content"><div class="p08-alert-header"><span class="p08-alert-job">${self._escapeHtml(String(alert.job_name || '-'))}</span><span class="p08-alert-badge p08-alert-badge--${alertSeverity.toLowerCase()}">${self._escapeHtml(alertSeverity)}</span></div><div class="p08-alert-message">${self._escapeHtml(String(alert.message || '-'))}</div><div class="p08-alert-time">${self._formatDateTime(String(alert.created_at || ''))}</div></div></div>`; }).join('')}</div><div class="p08-alerts-footer"><span class="p08-timestamp" data-timestamp>Atualizado: ${this._formatTime(Date.now())}</span></div></div>`;
  }

  _renderJobsPanel(data: Record<string, unknown>) {
    const self = this;
    const overview = (data.overview || {}) as Record<string, unknown>;
    const activity = (data.recent_activity || []) as Record<string, unknown>[];
    this.container.innerHTML = `<div class="p08-jobs"><div class="p08-jobs-grid"><div class="p08-metric-card"><span class="p08-metric-value">${this._formatNumber(overview.total_jobs as number)}</span><span class="p08-metric-label">Total de Jobs</span></div><div class="p08-metric-card"><span class="p08-metric-value">${this._formatNumber(overview.active_jobs as number)}</span><span class="p08-metric-label">Jobs Ativos</span></div><div class="p08-metric-card"><span class="p08-metric-value">${this._formatNumber(overview.running_jobs as number)}</span><span class="p08-metric-label">Em Execução</span></div><div class="p08-metric-card"><span class="p08-metric-value">${this._formatPercentage(overview.avg_success_rate as number)}</span><span class="p08-metric-label">Taxa de Sucesso</span></div></div><div class="p08-activity"><h3 class="p08-activity-title">Atividade Recente</h3><div class="p08-activity-list">${activity.slice(0, 8).map((item: Record<string, unknown>) => `<div class="p08-activity-item p08-activity-item--${item.status || 'unknown'}"><span class="p08-activity-icon">${item.status === 'success' ? SVGS.check : SVGS.x}</span><span class="p08-activity-name">${self._escapeHtml(item.job_name as string)}</span><span class="p08-activity-time">${self._formatDateTime(item.execution_start as string)}</span></div>`).join('')}</div></div><div class="p08-footer"><span class="p08-timestamp" data-timestamp>Atualizado: ${this._formatTime(Date.now())}</span></div></div>`;
  }

  _renderMetricsCards(data: Record<string, unknown>) {
    const self = this;
    const entries = Object.entries(data).slice(0, 8);
    this.container.innerHTML = `<div class="p08-metrics"><div class="p08-metrics-grid">${entries.map(entry => `<div class="p08-metric-card"><span class="p08-metric-value">${self._formatValue(entry[1])}</span><span class="p08-metric-label">${self._formatKey(entry[0])}</span></div>`).join('')}</div><div class="p08-footer"><span class="p08-timestamp" data-timestamp>Atualizado: ${this._formatTime(Date.now())}</span></div></div>`;
  }

  _renderGenericData(data: unknown) { this.container.innerHTML = `<div class="p08-generic"><pre class="p08-json">${this._escapeHtml(JSON.stringify(data, null, 2))}</pre><div class="p08-footer"><span class="p08-timestamp" data-timestamp>Atualizado: ${this._formatTime(Date.now())}</span></div></div>`; }

  _formatNumber(value: number | string | null | undefined) { if (value == null) return '--'; const num = parseFloat(String(value)); return isNaN(num) ? value : num.toLocaleString('pt-BR'); }
  _formatPercentage(value: number | string | null | undefined) { if (value == null) return '--'; const num = parseFloat(String(value)); return isNaN(num) ? value : `${num.toFixed(1)}%`; }
  _formatDateTime(dateStr: string) { if (!dateStr) return '--'; try { const d = new Date(dateStr); return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return dateStr; } }
  _formatTime(timestamp: number) { return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  _formatKey(key: string) { return String(key).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
  _formatValue(value: unknown) { if (value == null) return '--'; if (typeof value === 'boolean') return value ? 'Sim' : 'Não'; if (typeof value === 'number') return this._formatNumber(value); if (typeof value === 'object') return JSON.stringify(value); return String(value); }
  _escapeHtml(str: string | number | boolean | null | undefined) { if (!str) return ''; const div = document.createElement('div'); div.textContent = String(str); return div.innerHTML; }

  async destroy() { if (this.container) { this.container.innerHTML = ''; this.container.classList.remove('p08-loading-overlay', 'p08-has-error'); } this.mounted = false; this.hasData = false; this._lastDataHash = null; this._lastTimestamp = null; this.logger?.debug?.('ui.destroyed'); }
}

export default UIComponent;

export const MODULE_ID = 'panels-panel-08-ui-component';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { componentReady: true } }; }
