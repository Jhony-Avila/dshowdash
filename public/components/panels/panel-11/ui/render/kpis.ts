// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-render-kpis
// PURPOSE: Panel-11 Render KPIs
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS, SLA_TARGET from ../../core/constants.js
//   formatNumber from ../helpers.js
//
// PROVIDES:
//   renderKPIs() — exported function
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

import { ICONS, SLA_TARGET } from '../../core/constants.js';
import { formatNumber } from '../helpers.js';

export function renderKPIs(data: Record<string, unknown>) {
  const dataNode = (data.data as Record<string, unknown>) || {};
  const exec = (dataNode.executions as Record<string, unknown>) || {};
  const jobs = (dataNode.jobs as Record<string, unknown>) || {};
  const comp = (data.comparison as Record<string, unknown>) || {};

  const total = parseInt(exec.total as string) || 0;
  const success = parseInt(exec.success as string) || 0;
  const error = parseInt(exec.error as string) || 0;
  const avgRate = parseFloat(jobs.avg_success_rate as string) || 0;

  const successPct = total > 0 ? ((success / total) * 100).toFixed(1) : 0;
  const errorPct = total > 0 ? ((error / total) * 100).toFixed(1) : 0;

  const kpis = [
    { label: 'Total Execuções', value: formatNumber(total), icon: ICONS.bolt, change: comp.change_total, variant: 'neutral' },

    // @ts-expect-error TS migration - TS2365
    { label: 'Sucesso', value: formatNumber(success), subtitle: `${successPct}%`, icon: ICONS.check, change: comp.change_success, variant: successPct >= 95 ? 'success' : successPct >= 80 ? 'warning' : 'error' },

    // @ts-expect-error TS migration - TS2365
    { label: 'Erros', value: formatNumber(error), subtitle: `${errorPct}%`, icon: ICONS.x, change: comp.change_errors, invertChange: true, variant: errorPct <= 5 ? 'success' : errorPct <= 15 ? 'warning' : 'error' },
    { label: 'Taxa Média', value: `${avgRate.toFixed(1)}%`, icon: ICONS.trendUp, sla: true, variant: avgRate >= SLA_TARGET ? 'success' : avgRate >= 85 ? 'warning' : 'error' }
  ];

  return `<div class="p11-kpis">${kpis.map(kpi => renderKPICard(kpi)).join('')}</div>`;
}

function renderKPICard(kpi: Record<string, unknown>) {
  let changeHtml = '';
  if (kpi.change !== undefined && kpi.change !== null) {
    const val = parseFloat(kpi.change as string) || 0;
    const isPositive = kpi.invertChange ? val <= 0 : val >= 0;
    const arrow = val >= 0 ? ICONS.trendUp : ICONS.trendDown;
    const changeClass = isPositive ? 'p11-kpi-change--up' : 'p11-kpi-change--down';
    changeHtml = `<span class="p11-kpi-change ${changeClass}">${arrow} ${Math.abs(val).toFixed(1)}%</span>`;
  }

  let slaHtml = '';
  if (kpi.sla) {
    const rate = parseFloat(kpi.value as string) || 0;
    const metSla = rate >= SLA_TARGET;
    slaHtml = `
      <div class="p11-kpi-sla">
        <div class="p11-kpi-sla-row">
          <span class="p11-kpi-sla-label">SLA Target: ${SLA_TARGET}%</span>
          <span class="p11-badge ${metSla ? 'p11-badge--ok' : 'p11-badge--error'}">${metSla ? 'Atingido' : 'Abaixo'}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="p11-kpi p11-kpi--${kpi.variant}">
      <div class="p11-kpi-header">
        <span class="p11-kpi-label">${kpi.label}</span>
        <span class="p11-kpi-icon">${kpi.icon}</span>
      </div>
      <div class="p11-kpi-body">
        <span class="p11-kpi-value">${kpi.value}</span>
        ${kpi.subtitle ? `<span class="p11-kpi-subtitle">${kpi.subtitle}</span>` : ''}
      </div>
      <div class="p11-kpi-footer">
        ${changeHtml}
        <span class="p11-kpi-period">vs período anterior</span>
      </div>
      ${slaHtml}
    </div>
  `;
}

export default { renderKPIs };

export const MODULE_ID = 'panels-ui-render-kpis';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { kpisReady: true } }; }
