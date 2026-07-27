// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:utils:date-formatters
// PURPOSE: Panel-05 Dashboard Utils - Date Formatters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   formatRelativeTime() — exported function
//   formatDate() — exported function
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

export function formatRelativeTime(date: unknown) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date as string | number);
  if (isNaN(d.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  if (diffDay < 7) return `${diffDay}d atrás`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}sem atrás`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}m atrás`;
  return `${Math.floor(diffDay / 365)}a atrás`;
}

export function formatDate(date: unknown, options: Record<string, unknown> = {}) {
  const { format = 'short' } = options;
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date as string | number);
  if (isNaN(d.getTime())) return '—';
  switch (format) {
    case 'full': return d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    case 'long': return d.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
    case 'medium': return d.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
    case 'iso': return d.toISOString().slice(0, 10);
    case 'time': return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    case 'datetime': return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    case 'relative': return formatRelativeTime(d);
    default: return d.toLocaleDateString('pt-BR');
  }
}

export default { formatDate, formatRelativeTime };

export const MODULE_ID = 'panel-05:utils:date-formatters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { dateFormattersReady: true } }; }
