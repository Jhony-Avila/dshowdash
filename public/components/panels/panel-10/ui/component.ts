// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-10-ui-component
// PURPOSE: Panel-10 - UIComponent Enterprise
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
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement | null, logger: Record<string, unknown>) { this.container = container; this.logger = logger; this.mounted = false; this.hasData = false; }

  async init() { if (!this.container) { this.logger?.error?.('ui.no-container'); return; } this.mounted = true; this.logger?.debug?.('ui.init'); }

  showLoading() {
    if (!this.container) return;
    if (this.hasData) { this.container.classList.add('p10-loading-overlay'); }
    else { this.container.innerHTML = `<div class="p10-skeleton"><div class="p10-skeleton-grid">${Array(8).fill('<div class="p10-skeleton-card"></div>').join('')}</div><div class="p10-skeleton-table">${Array(5).fill('<div class="p10-skeleton-row"></div>').join('')}</div></div>`; }
  }

  hideLoading() { if (this.container) { this.container.classList.remove('p10-loading-overlay'); } }

  showError(message: string) {
    if (!this.container) return;
    if (this.hasData) {
      this.hideLoading();
      const existingBadge = this.container.querySelector('.p10-error-badge');
      if (!existingBadge) {
        const badge = document.createElement('div');
        badge.className = 'p10-error-badge';
        badge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${message || 'Erro'}`;
        this.container.insertBefore(badge, this.container.firstChild);
        setTimeout(() => { badge.remove(); }, 5000);
      }
    } else {
      this.container.innerHTML = `<div class="p10-error"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p class="p10-error-title">Erro ao carregar</p><p class="p10-error-message">${message || 'Não foi possível obter dados do servidor'}</p></div>`;
    }
  }

  update(data: Record<string, unknown>) {
    if (!this.container) return;
    this.hideLoading();
    try {
      const d = data as { data?: unknown; payload?: { data?: unknown } };
      const payload = d?.data || d?.payload?.data || data;
      if (!payload || typeof payload !== 'object') { this.showError('Dados inválidos'); return; }
      const p = payload as Record<string, unknown>;
      if (p.local || p.hostinger || p.vm_id !== undefined) { this.renderServerHealth(p); }
      else if (p.overview && p.recent_activity) { this.renderJobsPanel(p); }
      else if (Array.isArray(p)) { this.renderGenericList(p as Record<string, unknown>[]); }
      else { this.renderMetricsCards(p); }
      this.hasData = true;
      this.logger?.debug?.('ui.render-success');
    } catch (error: any) { this.logger?.error?.('ui.render-error', { error: error.message }); this.showError('Erro ao renderizar dados'); }
  }

  renderServerHealth(data: Record<string, unknown>) {
    const self = this;
    const local = (data.local || {}) as Record<string, number | string | undefined>;
    const vm = (data.hostinger || {}) as Record<string, unknown>;
    const status = data.status || (data.vm_state === 'running' ? 'online' : 'offline');
    const cpuPct = Number(local.cpu_percent) || 0;
    const ramPct = Number(local.ram_percent) || 0;
    const diskPct = Number(local.disk_percent) || 0;
    this.container.innerHTML = `<div class="p10-server-health"><div class="p10-status-banner p10-status-${status}"><div class="p10-status-indicator"></div><span class="p10-status-label">${status === 'online' ? 'Servidor Online' : 'Servidor Offline'}</span><span class="p10-status-host">${local.hostname || data.server_name || 'N/A'}</span></div><div class="p10-metrics-grid"><div class="p10-metric-card p10-metric-cpu"><div class="p10-metric-header"><svg class="p10-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/></svg><span>CPU</span></div><div class="p10-metric-value">${this.formatPercent(local.cpu_percent)}</div><div class="p10-metric-bar"><div class="p10-metric-bar-fill" style="width: ${Math.min(cpuPct, 100)}%"></div></div><div class="p10-metric-details"><span>Load: ${local.cpu_load_1 || 0} / ${local.cpu_load_5 || 0} / ${local.cpu_load_15 || 0}</span><span>${local.cpu_cores || data.vm_cpus || '-'} cores</span></div></div><div class="p10-metric-card p10-metric-ram"><div class="p10-metric-header"><svg class="p10-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg><span>RAM</span></div><div class="p10-metric-value">${this.formatPercent(local.ram_percent)}</div><div class="p10-metric-bar"><div class="p10-metric-bar-fill" style="width: ${Math.min(ramPct, 100)}%"></div></div><div class="p10-metric-details"><span>${this.formatMB(local.ram_used_mb)} / ${this.formatMB(local.ram_total_mb)}</span><span>${this.formatMB(local.ram_available_mb)} livre</span></div></div><div class="p10-metric-card p10-metric-disk"><div class="p10-metric-header"><svg class="p10-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg><span>Disco</span></div><div class="p10-metric-value">${this.formatPercent(local.disk_percent)}</div><div class="p10-metric-bar"><div class="p10-metric-bar-fill" style="width: ${Math.min(diskPct, 100)}%"></div></div><div class="p10-metric-details"><span>${local.disk_used_gb || 0} GB / ${local.disk_total_gb || 0} GB</span><span>${local.disk_free_gb || 0} GB livre</span></div></div><div class="p10-metric-card p10-metric-uptime"><div class="p10-metric-header"><svg class="p10-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Uptime</span></div><div class="p10-metric-value">${local.uptime_days || 0}<small>d</small></div><div class="p10-metric-subvalue">${local.uptime_hours || 0}h ${local.uptime_minutes || 0}m</div><div class="p10-metric-details"><span>Desde ${this.formatUptimeStart(local.uptime_seconds)}</span></div></div></div>${this.renderVMInfo(data)}<div class="p10-footer"><span>Coletado: ${local.collected_at || '-'}</span><span>IP: ${local.server_ip || data.vm_ipv4 || '-'}</span></div></div>`;
  }

  renderVMInfo(data: Record<string, unknown>) {
    if (!data.vm_id && !data.hostinger) return '';
    const vm = (data.hostinger || {}) as Record<string, unknown>;
    return `<div class="p10-vm-section"><div class="p10-section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>VPS Hostinger</div><div class="p10-vm-grid"><div class="p10-vm-item"><span class="p10-vm-label">ID</span><span class="p10-vm-value">${data.vm_id || vm.id || '-'}</span></div><div class="p10-vm-item"><span class="p10-vm-label">Estado</span><span class="p10-vm-value p10-vm-state-${data.vm_state || vm.state}">${data.vm_state || vm.state || '-'}</span></div><div class="p10-vm-item"><span class="p10-vm-label">Plano</span><span class="p10-vm-value">${data.vm_plan || vm.plan || '-'}</span></div><div class="p10-vm-item"><span class="p10-vm-label">CPUs</span><span class="p10-vm-value">${data.vm_cpus || vm.cpus || '-'}</span></div><div class="p10-vm-item"><span class="p10-vm-label">Memória</span><span class="p10-vm-value">${this.formatMB(data.vm_memory_mb || vm.memory)}</span></div><div class="p10-vm-item"><span class="p10-vm-label">Disco</span><span class="p10-vm-value">${this.formatMB(data.vm_disk_mb || vm.disk)}</span></div><div class="p10-vm-item"><span class="p10-vm-label">IPv4</span><span class="p10-vm-value">${data.vm_ipv4 || '-'}</span></div><div class="p10-vm-item"><span class="p10-vm-label">Template</span><span class="p10-vm-value">${data.vm_template || '-'}</span></div></div></div>`;
  }

  renderJobsPanel(data: Record<string, unknown>) {
    const self = this;
    const overview = (data.overview || {}) as Record<string, unknown>;
    const activity = (data.recent_activity || []) as Record<string, unknown>[];
    this.container.innerHTML = `<div class="p10-jobs-panel"><div class="p10-metrics-grid"><div class="p10-metric-card"><div class="p10-metric-header"><span>Total Jobs</span></div><div class="p10-metric-value">${this.formatNumber(overview.total_jobs)}</div></div><div class="p10-metric-card"><div class="p10-metric-header"><span>Ativos</span></div><div class="p10-metric-value">${this.formatNumber(overview.active_jobs)}</div></div><div class="p10-metric-card"><div class="p10-metric-header"><span>Em Execução</span></div><div class="p10-metric-value">${this.formatNumber(overview.running_jobs)}</div></div><div class="p10-metric-card"><div class="p10-metric-header"><span>Taxa Sucesso</span></div><div class="p10-metric-value">${this.formatPercent(overview.avg_success_rate)}</div></div></div><div class="p10-activity-section"><h3 class="p10-section-title">Atividade Recente</h3><div class="p10-activity-list">${(activity as Record<string, unknown>[]).slice(0, 10).map((item: Record<string, unknown>) => `<div class="p10-activity-item p10-activity-${item.status}"><div class="p10-activity-icon">${item.status === 'success' ? SVGS.check : SVGS.x}</div><div class="p10-activity-content"><div class="p10-activity-name">${item.job_name || '-'}</div><div class="p10-activity-meta"><span>${self.formatDateTime(item.execution_start)}</span><span>${self.formatDuration(item.execution_time_seconds)}</span></div></div></div>`).join('')}</div></div></div>`;
  }

  renderGenericList(items: Record<string, unknown>[]) {
    const self = this;
    if (!Array.isArray(items) || items.length === 0) { this.container.innerHTML = '<div class="p10-empty">Nenhum dado disponível</div>'; return; }
    const keys = Object.keys(items[0]).slice(0, 8);
    this.container.innerHTML = `<div class="p10-table-wrapper"><table class="p10-table"><thead><tr>${keys.map(key => `<th>${self.formatKey(key)}</th>`).join('')}</tr></thead><tbody>${items.slice(0, 20).map(item => `<tr>${keys.map(key => `<td>${self.formatValue(item[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  renderMetricsCards(data: Record<string, unknown>) {
    const self = this;
    const entries = Object.entries(data).filter(e => typeof e[1] !== 'object' || e[1] === null);
    if (entries.length === 0) { this.renderServerHealth(data); return; }
    this.container.innerHTML = `<div class="p10-metrics-grid">${entries.map(entry => `<div class="p10-metric-card"><div class="p10-metric-header"><span>${self.formatKey(entry[0])}</span></div><div class="p10-metric-value">${self.formatValue(entry[1])}</div></div>`).join('')}</div>`;
  }

  formatNumber(v: unknown) { if (v == null) return '--'; const n = parseFloat(v as string); return isNaN(n) ? String(v) : n.toLocaleString('pt-BR'); }
  formatPercent(v: unknown) { if (v == null) return '--'; const n = parseFloat(v as string); return isNaN(n) ? String(v) : `${n.toFixed(1)}%`; }
  formatMB(mb: unknown) { if (mb == null) return '--'; const n = parseFloat(mb as string); if (isNaN(n)) return String(mb); if (n >= 1024) return `${(n / 1024).toFixed(1)} GB`; return `${n.toFixed(0)} MB`; }
  formatDateTime(d: unknown) { if (!d) return '--'; try { return new Date(d as string).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(d); } }
  formatDuration(s: unknown) { if (!s) return '--'; const n = parseFloat(s as string); return isNaN(n) ? String(s) : `${n.toFixed(2)}s`; }
  formatUptimeStart(seconds: unknown) { if (!seconds) return '--'; const start = new Date(Date.now() - ((seconds as number) * 1000)); return start.toLocaleDateString('pt-BR'); }
  formatKey(k: string) { return String(k).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()); }
  formatValue(v: unknown) { if (v == null) return '--'; if (typeof v === 'boolean') return v ? 'Sim' : 'Não'; if (typeof v === 'number') return this.formatNumber(v); if (typeof v === 'object') return '--'; return String(v); }

  async destroy() { if (this.container) { this.container.innerHTML = ''; this.container.classList.remove('p10-loading-overlay'); } this.mounted = false; this.hasData = false; this.logger?.debug?.('ui.destroyed'); }
}

export default UIComponent;

export const MODULE_ID = 'panels-panel-10-ui-component';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { componentReady: true } }; }
