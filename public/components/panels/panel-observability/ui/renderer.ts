// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-observability/ui/renderer
// PURPOSE: Panel Observability - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../core/constants.js
//   formatNumber, formatPercent, formatMs, formatRelative, formatHealthStatus, es...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderHeader() — exported function
//   renderMetrics() — exported function
//   renderMetricCard() — exported function
//   renderActions() — exported function
//   renderModulesList() — exported function
//   renderRecentErrors() — exported function
//   renderSkeleton() — exported function
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

import { ICONS } from '../core/constants.js';
import { formatNumber, formatPercent, formatMs, formatRelative, formatHealthStatus, escapeHtml } from '../utils/formatters.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-observability/ui/renderer';

type PanelState = {
  health?: { status?: string };
  metrics?: { cpu?: number; memory?: number; requests?: number; latency?: number };
  actions?: { total?: number; accepted?: number; errors?: number; perMinute?: number };
};

export function renderHeader(state: PanelState): string {
  return `<div class="obs-header"><h3 class="obs-title">${ICONS.barChart} Observability</h3><span class="obs-status ${(state.health?.status || 'unknown').toLowerCase()}">${formatHealthStatus(state.health?.status || '')}</span></div>`;
}

export function renderMetrics(state: PanelState): string {
  const m = state.metrics || {};
  return `<div class="obs-metrics">${renderMetricCard('CPU', formatPercent(m.cpu), (m.cpu ?? 0) > 80 ? 'warning' : 'normal')}${renderMetricCard('Memória', formatPercent(m.memory), (m.memory ?? 0) > 80 ? 'warning' : 'normal')}${renderMetricCard('Requests', formatNumber(m.requests), 'normal')}${renderMetricCard('Latência', formatMs(m.latency ?? 0), (m.latency ?? 0) > 1000 ? 'warning' : 'normal')}</div>`;
}

export function renderMetricCard(label: string, value: string, status = 'normal'): string {
  return `<div class="metric-card metric-card--${status}"><span class="metric-value">${value}</span><span class="metric-label">${escapeHtml(label)}</span></div>`;
}

export function renderActions(state: PanelState): string {
  const a = state.actions || {};
  return `<div class="obs-actions"><div class="action-stat"><span class="stat-value">${formatNumber(a.total)}</span><span class="stat-label">Total</span></div><div class="action-stat success"><span class="stat-value">${formatNumber(a.accepted)}</span><span class="stat-label">Aceitas</span></div><div class="action-stat error"><span class="stat-value">${formatNumber(a.errors)}</span><span class="stat-label">Erros</span></div><div class="action-stat"><span class="stat-value">${formatNumber(a.perMinute)}/min</span><span class="stat-label">Taxa</span></div></div>`;
}

export function renderModulesList(modules: Record<string, unknown>): string {
  if (!modules || Object.keys(modules).length === 0) return '<div class="obs-empty">Nenhum módulo</div>';
  return `<ul class="obs-modules">${Object.entries(modules).map(([name, data]) =>

  // @ts-expect-error TS migration - TS2339
  `<li class="module-item module-item--${(data.status || 'unknown').toLowerCase()}"><span class="module-icon">${getStatusIcon(data.status)}</span><span class="module-name">${escapeHtml(name)}</span><span class="module-status">${data.status || 'unknown'}</span></li>`
).join('')}</ul>`;
}

export function renderRecentErrors(errors: Array<{ timestamp: number; error: unknown }>): string {
  if (!errors || errors.length === 0) return '<div class="obs-empty">Sem erros recentes</div>';
  return `<ul class="obs-errors">${errors.slice(0, 10).map((e: { timestamp: number; error: unknown }) =>
  `<li class="error-item"><span class="error-time">${formatRelative(e.timestamp)}</span><span class="error-msg">${escapeHtml((e.error as Error)?.message || String(e.error))}</span></li>`
).join('')}</ul>`;
}

function getStatusIcon(status: string): string {
  if (status === 'HEALTHY') return ICONS.check;
  if (status === 'UNHEALTHY') return ICONS.x;
  if (status === 'DEGRADED') return ICONS.warning;
  return '?';
}

export function renderSkeleton() {
  return '<div class="obs-skeleton"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>';
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderHeader, renderMetrics, renderMetricCard, renderActions, renderModulesList, renderRecentErrors, renderSkeleton };
