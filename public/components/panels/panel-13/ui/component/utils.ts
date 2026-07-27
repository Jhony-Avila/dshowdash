// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-component-utils
// PURPOSE: Panel-13 UI Component - Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STATUS_COLORS, SLA_THRESHOLDS from ../../core/constants.js
//
// PROVIDES:
//   formatNumber() — exported function
//   truncate() — exported function
//   getUptimeStatus() — exported function
//   getRateColor() — exported function
//   getStatusLabel() — exported function
//   generateSparkline() — exported function
//   applyFilters() — exported function
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


// @ts-expect-error TS migration - TS2305
import { STATUS_COLORS, SLA_THRESHOLDS } from '../../core/constants.js';

export function formatNumber(n: number | null | undefined) { if (n == null) return '—'; return n.toLocaleString('pt-BR'); }
export function truncate(str: string, max: number) { if (!str || str.length <= max) return str; return `${str.substring(0, max)}...`; }
export function getUptimeStatus(percent: number) { if (percent >= SLA_THRESHOLDS.EXCELLENT) return 'excellent'; if (percent >= SLA_THRESHOLDS.GOOD) return 'good'; if (percent >= SLA_THRESHOLDS.WARNING) return 'warning'; return 'critical'; }
export function getRateColor(rate: number) { if (rate >= SLA_THRESHOLDS.EXCELLENT) return STATUS_COLORS.excellent; if (rate >= SLA_THRESHOLDS.GOOD) return STATUS_COLORS.good; if (rate >= SLA_THRESHOLDS.WARNING) return STATUS_COLORS.warning; return STATUS_COLORS.critical; }
export function getStatusLabel(status: string) { const labels: Record<string, string> = { excellent: 'Excelente', good: 'Bom', warning: 'Atenção', critical: 'Crítico' }; return labels[status] || status; }

export function generateSparkline(rate: number) {
  const points = [];
  const height = 20, width = 60;
  const variance = Math.max(0, 100 - rate) / 10;
  for (let i = 0; i < 10; i++) { const y = height - ((rate + (Math.random() - 0.5) * variance) / 100 * height); points.push(`${i * (width/9)},${Math.max(2, Math.min(height-2, y))}`); }
  const color = STATUS_COLORS[getUptimeStatus(rate)];
  return `<svg width="${width}" height="${height}" class="p13-spark-svg"><polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function applyFilters(jobs: Record<string, unknown>[], filters: Record<string, unknown>, sortOptions: Record<string, unknown>) {
  let filtered = [...jobs];
  if (filters.search) { const search = (filters.search as string).toLowerCase(); filtered = filtered.filter(job => (job.job_name as string).toLowerCase().includes(search) || ((job.job_type as string) || '').toLowerCase().includes(search)); }
  if (filters.status !== 'all') { filtered = filtered.filter(job => job.status === filters.status); }
  const sortConfig = sortOptions[filters.sort as string] as Record<string, unknown> | undefined;
  if (sortConfig) { filtered.sort((a, b) => { const aVal = a[sortConfig.field as string]; const bVal = b[sortConfig.field as string]; if (typeof aVal === 'string') return sortConfig.order === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal); return sortConfig.order === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number); }); }
  return filtered;
}

export default { formatNumber, truncate, getUptimeStatus, getRateColor, getStatusLabel, generateSparkline, applyFilters };

export const MODULE_ID = 'panel-13.ui.utils';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { utilsReady: true } }; }
