// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10-metrics
// PURPOSE: Panel-10 MetricsGrid Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   THRESHOLDS from ../core/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MetricsGrid() — exported function
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

import { THRESHOLDS } from '../core/constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-10-metrics';

export function MetricsGrid(this: any, container: HTMLElement, logger: Record<string, unknown> | null) {
  this.container = container;
  this.logger = logger || null;
  this.element = null;
}

MetricsGrid.prototype.render = function() {
  this.element = document.createElement('div');
  this.element.className = 'p10-metrics-grid';
  this.element.id = 'p10-metrics-grid';
  this.container.appendChild(this.element);
  return this.element;
};

MetricsGrid.prototype.update = function(data: Record<string, unknown>) {
  if (!this.element) this.render();
  if (!data) { this.showEmpty(); return; }
  const local = data.local || data;
  this.element.innerHTML = this.renderCPUCard(local) + this.renderRAMCard(local) + this.renderDiskCard(local) + this.renderUptimeCard(local);
};

MetricsGrid.prototype.renderCPUCard = function(data: Record<string, unknown>) {
  const percent = data.cpu_percent != null ? data.cpu_percent as number : 0;
  const statusClass = this.getStatusClass(percent, THRESHOLDS.CPU_WARNING, THRESHOLDS.CPU_CRITICAL);
  return `<div class="p10-metric-card p10-metric-cpu ${statusClass}"><div class="p10-metric-header"><svg class="p10-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg><span>CPU</span></div><div class="p10-metric-value">${this.formatPercent(percent)}</div><div class="p10-metric-bar"><div class="p10-metric-bar-fill" style="width: ${Math.min(percent, 100)}%"></div></div><div class="p10-metric-details"><span>Load: ${data.cpu_load_1 || 0}</span><span>${data.cpu_cores || '-'} cores</span></div></div>`;
};

MetricsGrid.prototype.renderRAMCard = function(data: Record<string, unknown>) {
  const percent = data.ram_percent != null ? data.ram_percent as number : 0;
  const statusClass = this.getStatusClass(percent, THRESHOLDS.RAM_WARNING, THRESHOLDS.RAM_CRITICAL);
  return `<div class="p10-metric-card p10-metric-ram ${statusClass}"><div class="p10-metric-header"><svg class="p10-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg><span>RAM</span></div><div class="p10-metric-value">${this.formatPercent(percent)}</div><div class="p10-metric-bar"><div class="p10-metric-bar-fill" style="width: ${Math.min(percent, 100)}%"></div></div><div class="p10-metric-details"><span>${this.formatMB(data.ram_used_mb)} usado</span><span>${this.formatMB(data.ram_total_mb)} total</span></div></div>`;
};

MetricsGrid.prototype.renderDiskCard = function(data: Record<string, unknown>) {
  const percent = data.disk_percent != null ? data.disk_percent as number : 0;
  const statusClass = this.getStatusClass(percent, THRESHOLDS.DISK_WARNING, THRESHOLDS.DISK_CRITICAL);
  return `<div class="p10-metric-card p10-metric-disk ${statusClass}"><div class="p10-metric-header"><svg class="p10-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg><span>Disco</span></div><div class="p10-metric-value">${this.formatPercent(percent)}</div><div class="p10-metric-bar"><div class="p10-metric-bar-fill" style="width: ${Math.min(percent, 100)}%"></div></div><div class="p10-metric-details"><span>${data.disk_used_gb || 0} GB usado</span><span>${data.disk_free_gb || 0} GB livre</span></div></div>`;
};

MetricsGrid.prototype.renderUptimeCard = (data: Record<string, unknown>) => `<div class="p10-metric-card p10-metric-uptime"><div class="p10-metric-header"><svg class="p10-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Uptime</span></div><div class="p10-metric-value">${data.uptime_days || 0}<small>d</small></div><div class="p10-metric-subvalue">${data.uptime_hours || 0}h ${data.uptime_minutes || 0}m</div></div>`;

MetricsGrid.prototype.getStatusClass = (percent: number, warningThreshold: number, criticalThreshold: number) => {
  if (percent >= criticalThreshold) return 'critical';
  if (percent >= warningThreshold) return 'warning';
  return 'normal';
};

MetricsGrid.prototype.formatPercent = (value: number | null | undefined) => {
  if (value == null) return '--';
  return `${parseFloat(String(value)).toFixed(1)}%`;
};

MetricsGrid.prototype.formatMB = (mb: number | null | undefined) => {
  if (mb == null) return '--';
  const n = parseFloat(String(mb));
  if (n >= 1024) return `${(n / 1024).toFixed(1)} GB`;
  return `${n.toFixed(0)} MB`;
};

MetricsGrid.prototype.escapeHtml = (text: string) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

MetricsGrid.prototype.showLoading = function() {
  if (!this.element) return;
  this.element.innerHTML = '<div class="p10-loading" role="status"><div class="p10-loading-spinner"></div><span>Carregando métricas...</span></div>';
};

MetricsGrid.prototype.showEmpty = function() {
  if (!this.element) return;
  this.element.innerHTML = '<div class="p10-empty" role="status"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>Nenhum dado disponível</span></div>';
};

MetricsGrid.prototype.showError = function(message: string) {
  if (!this.element) return;
  this.element.innerHTML = `<div class="p10-error" role="alert"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span>${this.escapeHtml(message) || 'Erro ao carregar'}</span></div>`;
};

MetricsGrid.prototype.destroy = function() {
  if (this.element) { this.element.remove(); this.element = null; }
  if (this.logger && this.logger.debug) this.logger.debug('metrics-grid.destroyed');
};

MetricsGrid.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, elementMounted: !!this.element };
};

MetricsGrid.prototype.healthCheck = function() {
  return { status: this.element ? 'HEALTHY' : 'IDLE', moduleId: MODULE_ID, version: VERSION, checks: { containerReady: !!this.container, elementMounted: !!this.element } };
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { classReady: typeof MetricsGrid === 'function' } }; }

export default MetricsGrid;
