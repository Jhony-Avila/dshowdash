// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-render-bottom
// PURPOSE: Panel-11 Render Bottom Section (Errors Table + Donut)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS, SEVERITY from ../../core/constants.js
//   formatNumber, truncate, extractJobName from ../helpers.js
//
// PROVIDES:
//   renderBottomSection() — exported function
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

import { ICONS, SEVERITY } from '../../core/constants.js';
import { formatNumber, truncate, extractJobName } from '../helpers.js';

export function renderBottomSection(data: Record<string, unknown>) {
  const topErrors = (data.top_errors as Record<string, unknown>[]) || [];
  const dataNode = (data.data as Record<string, unknown>) || {};
  const exec = (dataNode.executions as Record<string, unknown>) || {};
  const total = parseInt(exec.total as string) || 1;
  const success = parseInt(exec.success as string) || 0;
  const error = parseInt(exec.error as string) || 0;

  return `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;padding:12px 16px;">
      ${renderTopErrorsTable(topErrors)}
      ${renderProportionDonut(success, error, total)}
    </div>
  `;
}

function renderTopErrorsTable(errors: Record<string, unknown>[]) {
  const top5 = (errors || []).slice(0, 5);
  
  return `
    <div class="p11-table-card">
      <div class="p11-table-header">
        <div class="p11-table-title">
          <span class="p11-table-title-icon">${ICONS.x}</span>
          <span class="p11-table-title-text">Top Jobs com Erros</span>
        </div>
        <span class="p11-table-count">${top5.length} registros</span>
      </div>
      ${top5.length === 0 ? `<div class="p11-table-empty">Nenhum erro registrado</div>` : `
        <div class="p11-table-wrapper">
          <table class="p11-table">
            <thead><tr><th>Job</th><th class="right">Erros</th><th class="right">Taxa</th><th>Severidade</th></tr></thead>
            <tbody>
              ${top5.map((e: Record<string, unknown>) => {
                const jobName = (e.job_name as string) || extractJobName(e.error_message as string) || 'Desconhecido';
                const errorRate = parseFloat(e.error_rate as string) || 0;
                const severity = errorRate > 30 ? 'critical' : errorRate > 15 ? 'high' : errorRate > 5 ? 'medium' : 'low';
                const sev = SEVERITY[severity];
                return `
                  <tr data-clickable data-error-job="${jobName}" title="${e.error_message || ''}">
                    <td class="p11-table-cell--truncate">${truncate(jobName, 25)}</td>
                    <td class="right p11-table-cell--error">${e.errors || e.occurrences || 0}</td>
                    <td class="right">${errorRate.toFixed(1)}%</td>
                    <td><span class="p11-badge" style="background:${sev.bg};color:${sev.color};">${sev.label}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

function renderProportionDonut(success: number, error: number, total: number) {
  const successPct = ((success / total) * 100).toFixed(1);
  const errorPct = ((error / total) * 100).toFixed(1);
  const circumference = 2 * Math.PI * 40;
  const successLength = (success / total) * circumference;
  const errorLength = (error / total) * circumference;

  return `
    <div class="p11-card" style="padding:16px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">
        <span class="p11-icon" style="color:var(--p11-accent-light);">${ICONS.activity}</span>
        <span style="font-size:12px;font-weight:600;color:var(--p11-text-primary);">Proporção</span>
      </div>
      <div class="p11-donut-container">
        <svg class="p11-donut-svg" viewBox="0 0 100 100">
          <circle class="p11-donut-ring p11-donut-ring--bg" cx="50" cy="50" r="40"/>
          <circle class="p11-donut-ring p11-donut-ring--success" cx="50" cy="50" r="40" stroke-dasharray="${successLength} ${circumference}" stroke-dashoffset="0" transform="rotate(-90 50 50)"/>
          <circle class="p11-donut-ring p11-donut-ring--error" cx="50" cy="50" r="40" stroke-dasharray="${errorLength} ${circumference}" stroke-dashoffset="${-successLength}" transform="rotate(-90 50 50)"/>
          <text class="p11-donut-value" x="50" y="46" text-anchor="middle">${formatNumber(total)}</text>
          <text class="p11-donut-label" x="50" y="58" text-anchor="middle">execuções</text>
        </svg>
        <div class="p11-donut-legend">
          <div class="p11-donut-legend-item"><span class="p11-donut-legend-dot p11-donut-legend-dot--success"></span><span style="font-size:10px;color:var(--p11-text-secondary);">${successPct}%</span></div>
          <div class="p11-donut-legend-item"><span class="p11-donut-legend-dot p11-donut-legend-dot--error"></span><span style="font-size:10px;color:var(--p11-text-secondary);">${errorPct}%</span></div>
        </div>
      </div>
    </div>
  `;
}

export default { renderBottomSection };

export const MODULE_ID = 'panels-ui-render-bottom';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
