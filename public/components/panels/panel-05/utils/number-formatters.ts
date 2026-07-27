// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:utils:number-formatters
// PURPOSE: Panel-05 Dashboard Utils - Number Formatters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   formatCompact() — exported function
//   formatCurrency() — exported function
//   formatNumber() — exported function
//   formatPercent() — exported function
//   formatDelta() — exported function
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

export function formatCompact(value: unknown, options: Record<string, unknown> = {}) {
  const { prefix = '', suffix = '', decimals = 1 } = options;
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  const num = Number(value);
  const absNum = Math.abs(num);
  let formatted;
  if (absNum >= 1e9) formatted = `${(num / 1e9).toFixed(Number(decimals))}B`;
  else if (absNum >= 1e6) formatted = `${(num / 1e6).toFixed(Number(decimals))}M`;
  else if (absNum >= 1e3) formatted = `${(num / 1e3).toFixed(Number(decimals))}K`;
  else formatted = num.toFixed(Number(decimals));
  return `${prefix}${formatted}${suffix}`;
}

export function formatCurrency(value: unknown, options: Record<string, unknown> = {}) {
  const { currency = 'BRL', compact = false, decimals = 2 } = options;
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  const num = Number(value);
  if (compact && Math.abs(num) >= 1000) return formatCompact(num, { prefix: 'R$ ', decimals: 1 });
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency as string, minimumFractionDigits: Number(decimals), maximumFractionDigits: Number(decimals) }).format(num);
}

export function formatNumber(value: unknown, options: Record<string, unknown> = {}) {
  const { decimals = 0, compact = false } = options;
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  const num = Number(value);
  if (compact && Math.abs(num) >= 1000) return formatCompact(num, { decimals: 1 });
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: Number(decimals), maximumFractionDigits: Number(decimals) }).format(num);
}

export function formatPercent(value: unknown, options: Record<string, unknown> = {}) {
  const { decimals = 1, showSign = false } = options;
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  const num = Number(value);
  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(Number(decimals))}%`;
}

export function formatDelta(value: unknown, options: Record<string, unknown> = {}) {
  const { decimals = 1, type = 'percent' } = options;
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  const num = Number(value);
  const sign = num > 0 ? '+' : '';
  const suffix = type === 'percent' ? '%' : '';
  return `${sign}${num.toFixed(Number(decimals))}${suffix}`;
}

export default { formatCurrency, formatNumber, formatCompact, formatPercent, formatDelta };

export const MODULE_ID = 'panel-05:utils:number-formatters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
