// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-weather-sp/utils/formatters
// PURPOSE: Status  - Formatters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   date() — exported function
//   time() — exported function
//   datetime() — exported function
//   relative() — exported function
//   number() — exported function
//   currency() — exported function
//   percent() — exported function
//   bytes() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
export const MODULE_ID = 'panels/panel-status-weather-sp/utils/formatters';

export function date(d: string | number | Date, locale = 'pt-BR') { return new Date(d).toLocaleDateString(locale); }
export function time(d: string | number | Date, locale = 'pt-BR') { return new Date(d).toLocaleTimeString(locale); }
export function datetime(d: string | number | Date, locale = 'pt-BR') { return new Date(d).toLocaleString(locale); }
export function relative(d: string | number | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function number(n: number, locale = 'pt-BR') { return new Intl.NumberFormat(locale).format(n); }
export function currency(n: number, currency = 'BRL', locale = 'pt-BR') { return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n); }
export function percent(n: number, decimals = 0) { return `${(n * 100).toFixed(decimals)}%`; }
export function bytes(n: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { date, time, datetime, relative, number, currency, percent, bytes, healthCheck, info, VERSION, MODULE_ID };
