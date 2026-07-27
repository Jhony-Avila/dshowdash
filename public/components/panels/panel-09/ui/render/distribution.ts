// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-render-distribution
// PURPOSE: Panel-09 Render Distribution & Alerts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ALERT_THRESHOLD, STATUS_COLORS, STATUS_LABELS from ../constants.js
//
// PROVIDES:
//   renderStatusDistribution() — exported function
//   renderAlerts() — exported function
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

import { ALERT_THRESHOLD, STATUS_COLORS, STATUS_LABELS } from '../constants.js';

const SVGS = {
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  turtle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10c-2 0-3 1-3 2"/><path d="M4.17 15.89a4 4 0 0 1 3.19-5.71A7.12 7.12 0 0 1 9 8c3 0 6 2 7 4a4 4 0 0 1 4 4.18v.62a4 4 0 0 1-4 3.2H7a4 4 0 0 1-2.83-6.11z"/><path d="m8 16 .5-.5"/><path d="m16 16-.5-.5"/></svg>',
  alertCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  checkCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
};

export function renderStatusDistribution(container: HTMLElement, data: Record<string, unknown>) {
  const distEl = container.querySelector('[data-status-dist]');
  if (!distEl) return;

  const dist = (data.status_distribution || []) as Record<string, unknown>[];
  if (!dist.length) { distEl.innerHTML = '<div style="text-align:center;color:#606070;font-size:11px;">Sem dados</div>'; return; }

  const total = dist.reduce((sum: number, d: Record<string, unknown>) => sum + parseInt(d.count as string), 0);

  distEl.innerHTML = dist.map((d: Record<string, unknown>) => {
    const pct = total > 0 ? ((parseInt(d.count as string) / total) * 100).toFixed(1) : 0;
    const color = (STATUS_COLORS as Record<string, string>)[d.status as string] || '#606070';
    const label = (STATUS_LABELS as Record<string, string>)[d.status as string] || d.status;
    return `<div style="display:flex;align-items:center;gap:8px;"><span style="width:8px;height:8px;background:${color};border-radius:50%;"></span><span style="flex:1;font-size:11px;color:#a0a0b0;">${label}</span><span style="font-size:11px;font-weight:600;color:#f0f0f5;">${d.count}</span><span style="font-size:10px;color:#606070;">(${pct}%)</span></div><div style="height:3px;background:#2a2a3a;border-radius:2px;overflow:hidden;margin-left:16px;"><div style="height:100%;width:${pct}%;background:${color};border-radius:2px;"></div></div>`;
  }).join('');
}

export function renderAlerts(container: HTMLElement, data: Record<string, unknown>) {
  const alertsEl = container.querySelector('[data-alerts]');
  if (!alertsEl) return;

  const alerts: { icon: string; text: string; color: string }[] = [];
  const today = data.today_vs_yesterday as Record<string, Record<string, unknown>> | undefined;
  if (today) {
    const successChange = parseFloat(today.change?.success as string) || 0;
    if (successChange < -ALERT_THRESHOLD) {
      alerts.push({ icon: SVGS.warning, text: `Taxa de sucesso caiu ${Math.abs(successChange).toFixed(1)}% em relação a ontem`, color: '#ef4444' });
    }
    const timeChange = parseFloat(today.change?.avg_time as string) || 0;
    if (timeChange > ALERT_THRESHOLD * 2) {
      alerts.push({ icon: SVGS.turtle, text: `Tempo médio aumentou ${timeChange.toFixed(1)}%`, color: '#f59e0b' });
    }
  }

  const sr = data.success_rate as Record<string, number> | undefined;
  if (sr && sr.today < 80) {
    alerts.push({ icon: SVGS.alertCircle, text: `Taxa de sucesso abaixo de 80% (${sr.today.toFixed(1)}%)`, color: '#ef4444' });
  } else if (sr && sr.today >= 90) {
    alerts.push({ icon: SVGS.checkCircle, text: `Excelente taxa de sucesso: ${sr.today.toFixed(1)}%`, color: '#22c55e' });
  }

  if (alerts.length === 0) {
    alerts.push({ icon: SVGS.checkCircle, text: 'Sistema operando dentro dos parâmetros normais', color: '#22c55e' });
  }

  alertsEl.innerHTML = alerts.map(a => `<div style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 14px;background:#16161f;border:1px solid #2a2a3a;border-left:3px solid ${a.color};border-radius:6px;"><span style="display:inline-flex;">${a.icon}</span><span style="font-size:11px;color:#a0a0b0;">${a.text}</span></div>`).join('');
}

export default { renderStatusDistribution, renderAlerts };

export const MODULE_ID = 'panels-ui-render-distribution';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
