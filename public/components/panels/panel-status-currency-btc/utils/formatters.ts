// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-currency-btc/utils/formatters
// PURPOSE: Status Currency BTC - Formatters
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
export const MODULE_ID = 'panels/panel-status-currency-btc/utils/formatters';
export const date = (d: string | number | Date, locale = 'pt-BR') => new Date(d).toLocaleDateString(locale);
export const time = (d: string | number | Date, locale = 'pt-BR') => new Date(d).toLocaleTimeString(locale);
export const datetime = (d: string | number | Date, locale = 'pt-BR') => new Date(d).toLocaleString(locale);
export const relative = (d: string | number | Date) => { const diff = Date.now() - new Date(d).getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return 'agora'; if (mins < 60) return `${mins}m atrás`; const hours = Math.floor(mins / 60); if (hours < 24) return `${hours}h atrás`; const days = Math.floor(hours / 24); return `${days}d atrás`; };
export const number = (n: number, locale = 'pt-BR') => new Intl.NumberFormat(locale).format(n);
export const currency = (n: number, curr = 'BRL', locale = 'pt-BR') => new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format(n);
export const percent = (n: number, decimals = 0) => `${(n * 100).toFixed(decimals)}%`;
export const bytes = (n: number) => { const units = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; } return `${n.toFixed(1)} ${units[i]}`; };
export const healthCheck = () => ({ status: 'healthy', version: VERSION, moduleId: MODULE_ID });
export const info = () => ({ version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() });
export default { date, time, datetime, relative, number, currency, percent, bytes, healthCheck, info, VERSION, MODULE_ID };
