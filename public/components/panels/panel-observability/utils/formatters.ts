// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-observability/utils/formatters
// PURPOSE: Panel Observability - Formatters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatNumber() — exported function
//   formatPercent() — exported function
//   formatBytes() — exported function
//   formatMs() — exported function
//   formatUptime() — exported function
//   formatDateTime() — exported function
//   formatRelative() — exported function
//   formatHealthStatus() — exported function
//   formatHealthBadge() — exported function
//   escapeHtml() — exported function
//   debounce() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-observability/utils/formatters';

export function formatNumber(value: number | null | undefined): string { if (value === null || value === undefined) return '0'; const num = parseFloat(String(value)); if (isNaN(num)) return '0'; return num.toLocaleString('pt-BR'); }
export function formatPercent(value: number | null | undefined, decimals = 1): string { if (value === null || value === undefined) return '0%'; const num = parseFloat(String(value)); if (isNaN(num)) return '0%'; return `${num.toFixed(decimals)}%`; }
export function formatBytes(bytes: number): string { if (!bytes) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`; }
export function formatMs(ms: number): string { if (!ms) return '0ms'; if (ms < 1000) return `${Math.round(ms)}ms`; return `${(ms / 1000).toFixed(2)}s`; }
export function formatUptime(ms: number): string { if (!ms) return '0s'; const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60); const d = Math.floor(h / 24); if (d > 0) return `${d}d ${h % 24}h`; if (h > 0) return `${h}h ${m % 60}m`; if (m > 0) return `${m}m ${s % 60}s`; return `${s}s`; }
export function formatDateTime(ts: number | string | null | undefined): string { if (!ts) return '--'; const d = new Date(ts); return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }); }
export function formatRelative(ts: number | string | null | undefined): string { if (!ts) return '--'; const diff = Date.now() - new Date(ts).getTime(); if (diff < 60000) return 'agora'; if (diff < 3600000) return `${Math.floor(diff / 60000)} min`; if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`; return `${Math.floor(diff / 86400000)}d`; }

export function formatHealthStatus(status: string): string {
  const map: Record<string, string> = { HEALTHY: '🟢 Saudável', DEGRADED: '🟡 Degradado', UNHEALTHY: '🔴 Crítico', unknown: '⚪ Desconhecido' };
  return map[status] || status || '--';
}

export function formatHealthBadge(status: string): string {
  const colors: Record<string, string> = { HEALTHY: '#28a745', DEGRADED: '#ffc107', UNHEALTHY: '#dc3545', unknown: '#6c757d' };
  return `<span class="health-badge" style="background:${colors[status] || '#6c757d'}">${status || 'unknown'}</span>`;
}

export function escapeHtml(text: string): string { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
export function debounce(fn: (...args: unknown[]) => void, delay = 300): (...args: unknown[]) => void { let t: ReturnType<typeof setTimeout>; return (...a: unknown[]) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { formatNumber, formatPercent, formatBytes, formatMs, formatUptime, formatDateTime, formatRelative, formatHealthStatus, formatHealthBadge, escapeHtml, debounce };
