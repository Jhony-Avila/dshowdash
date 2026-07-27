// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-render-grid
// PURPOSE: Panel-11 Render Grid (Distribution, Jobs, Alerts)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS, SEVERITY from ../../core/constants.js
//   formatNumber from ../helpers.js
//
// PROVIDES:
//   renderGrid() — exported function
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
import { formatNumber } from '../helpers.js';

export function renderGrid(data: Record<string, unknown>) {
  return `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px 16px;">
      ${renderDistributionCard(data)}
      ${renderJobsCard(data)}
      ${renderAlertsCard(data)}
    </div>
  `;
}

function renderDistributionCard(data: Record<string, unknown>) {
  const dataNode = (data.data as Record<string, unknown>) || {};
  const exec = (dataNode.executions as Record<string, unknown>) || {};
  const total = parseInt(exec.total as string) || 1;
  const success = parseInt(exec.success as string) || 0;
  const error = parseInt(exec.error as string) || 0;
  const timeout = parseInt(exec.timeout as string) || 0;

  const segments = [
    { label: 'Sucesso', value: success, pct: ((success/total)*100).toFixed(1), variant: 'success' },
    { label: 'Erro', value: error, pct: ((error/total)*100).toFixed(1), variant: 'error' },
    { label: 'Timeout', value: timeout, pct: ((timeout/total)*100).toFixed(1), variant: 'warning' }
  ].filter(s => s.value > 0);

  return `
    <div class="p11-card" style="padding:16px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">
        <span class="p11-icon" style="color:var(--p11-accent-light);">${ICONS.activity}</span>
        <span style="font-size:12px;font-weight:600;color:var(--p11-text-primary);">Distribuição</span>
      </div>
      <div class="p11-bar-container">
        ${segments.map(s => `<div class="p11-bar-segment p11-bar-segment--${s.variant}" style="width:${s.pct}%;" title="${s.label}: ${s.pct}%"></div>`).join('')}
      </div>
      <div class="p11-bar-legend">
        ${segments.map(s => `
          <div class="p11-bar-legend-item">
            <div class="p11-bar-legend-label">
              <span class="p11-bar-legend-dot" style="background:var(--p11-${s.variant === 'success' ? 'ok' : s.variant});"></span>
              <span class="p11-bar-legend-name">${s.label}</span>
            </div>
            <div class="p11-bar-legend-values">
              <span class="p11-bar-legend-value">${formatNumber(s.value)}</span>
              <span class="p11-bar-legend-pct">${s.pct}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderJobsCard(data: Record<string, unknown>) {
  const dataNode = (data.data as Record<string, unknown>) || {};
  const jobs = (dataNode.jobs as Record<string, unknown>) || {};
  const total = parseInt(jobs.total as string) || 0;
  const avgRate = parseFloat(jobs.avg_success_rate as string) || 0;

  return `
    <div class="p11-card" style="padding:16px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">
        <span class="p11-icon" style="color:var(--p11-accent);">${ICONS.server}</span>
        <span style="font-size:12px;font-weight:600;color:var(--p11-text-primary);">Jobs Ativos</span>
      </div>
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:42px;font-weight:700;color:var(--p11-text-primary);line-height:1;font-family:var(--p11-font-mono);">${total}</div>
        <div style="font-size:11px;color:var(--p11-text-muted);margin-top:4px;">jobs no período</div>
      </div>
      <div class="p11-divider"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:11px;color:var(--p11-text-muted);">Taxa média de sucesso</span>
        <span class="p11-badge ${avgRate >= 95 ? 'p11-badge--ok' : 'p11-badge--warning'}">${avgRate.toFixed(1)}%</span>
      </div>
    </div>
  `;
}

function renderAlertsCard(data: Record<string, unknown>) {
  const dataNode = (data.data as Record<string, unknown>) || {};
  const alerts = (dataNode.alerts as Record<string, unknown>) || {};
  const total = parseInt(alerts.total as string) || 0;
  const severity = total > 1000 ? 'critical' : total > 500 ? 'high' : total > 100 ? 'medium' : 'low';
  const sev = SEVERITY[severity];

  return `
    <div class="p11-card" style="padding:16px;border-left:3px solid ${sev.color};">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">
        <span class="p11-icon" style="color:${sev.color};">${ICONS.alertTriangle}</span>
        <span style="font-size:12px;font-weight:600;color:var(--p11-text-primary);">Alertas</span>
        <span class="p11-badge" style="background:${sev.bg};color:${sev.color};">${sev.label}</span>
      </div>
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:42px;font-weight:700;color:${sev.color};line-height:1;font-family:var(--p11-font-mono);">${formatNumber(total)}</div>
        <div style="font-size:11px;color:var(--p11-text-muted);margin-top:4px;">erros + timeouts</div>
      </div>
      <div class="p11-divider"></div>
      <button class="p11-btn" style="width:100%;justify-content:center;" data-action="view-alerts">
        ${ICONS.zap} Ver detalhes
      </button>
    </div>
  `;
}

export default { renderGrid };

export const MODULE_ID = 'panels-ui-render-grid';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { gridReady: true } }; }
