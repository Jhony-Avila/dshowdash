// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-13-ui-kpis
// PURPOSE: Painel-13 KPI Cards
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

const SVGS = { barChart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>', check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', target: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>' };

export class KPIGrid {
  [key: string]: any;
  constructor(container: HTMLElement) { this.container = container; this.element = null; }
  render() { this.element = document.createElement('div'); this.element.className = 'p13-kpi-grid'; this.container.appendChild(this.element); return this.element; }
  update(data: Record<string, unknown>) { if (!this.element || !data) return; const availability = data.availability as number; const totalExecutions = data.totalExecutions as number; const failures = data.failures as number; const criticalJobs = data.criticalJobs as number; const statusClass = availability >= 99.0 ? 'success' : availability >= 95.0 ? 'warning' : 'error'; this.element.innerHTML = `<div class="p13-kpi ${statusClass}"><div class="p13-kpi-icon">${SVGS.barChart}</div><div class="p13-kpi-value">${availability.toFixed(2)}%</div><div class="p13-kpi-label">Disponibilidade</div></div><div class="p13-kpi info"><div class="p13-kpi-icon">${SVGS.check}</div><div class="p13-kpi-value">${this.formatNumber(totalExecutions)}</div><div class="p13-kpi-label">Total Execuções</div></div><div class="p13-kpi ${failures > 100 ? 'warning' : 'info'}"><div class="p13-kpi-icon">${SVGS.warning}</div><div class="p13-kpi-value">${this.formatNumber(failures)}</div><div class="p13-kpi-label">Falhas</div></div><div class="p13-kpi ${criticalJobs > 0 ? 'error' : 'success'}"><div class="p13-kpi-icon">${SVGS.target}</div><div class="p13-kpi-value">${criticalJobs}</div><div class="p13-kpi-label">Jobs Críticos</div></div>`; }
  formatNumber(num: number) { return new Intl.NumberFormat('pt-BR').format(num); }
  showLoading() { if (!this.element) return; this.element.innerHTML = '<div class="p13-loading">Carregando...</div>'; }
  showError() { if (!this.element) return; this.element.innerHTML = `<div class="p13-error">${SVGS.warning} Erro ao carregar dados</div>`; }
  destroy() { if (this.element) { this.element.remove(); this.element = null; } }
}

export const MODULE_ID = 'panels-panel-13-ui-kpis';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { kpisReady: true } }; }
