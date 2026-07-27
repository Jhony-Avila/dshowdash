// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-maps/utils/formatters
// PURPOSE: Data formatting utilities (currency, date, number, text)
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   formatCurrency(value, locale, currency) — format as currency
//   formatNumber(value, locale, options) — format number
//   formatDate/formatTime(date, locale) — format date/time
//   formatPercentage(value, decimals) — format as percentage
//   truncate(str, length, suffix) — truncate string
//   capitalize/slugify(str) — text transforms
//   healthCheck() — module health status
// ═══════════════════════════════════════════════════════════════
// panel-maps - Formatters (Enterprise)
// @version 8.1.0-ENTERPRISE
'use strict';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-maps/utils/formatters';

export function formatCurrency(value: unknown, locale = 'pt-BR', currency = 'BRL') {
  // @ts-expect-error TS migration - TS2769
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatNumber(value: unknown, locale = 'pt-BR', options = {}) {
  // @ts-expect-error TS migration - TS2769
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(date: unknown, locale = 'pt-BR', options = {}) {
  // @ts-expect-error TS migration - TS2769
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

export function formatTime(date: unknown, locale = 'pt-BR') {
  // @ts-expect-error TS migration - TS2769
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(date));
}

export function formatPercentage(value: unknown, decimals = 2) {
  // @ts-expect-error TS migration - TS2362
  return `${(value * 100).toFixed(decimals)}%`;
}

export function truncate(str: unknown, length = 50, suffix = '...') {
  // @ts-expect-error TS migration - TS2339
  if (!str || str.length <= length) return str;
  // @ts-expect-error TS migration - TS2339
  return str.substring(0, length - suffix.length) + suffix;
}

// @ts-expect-error TS migration - TS2339
export function capitalize(str: unknown) { return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''; }
// @ts-expect-error TS migration - TS2339
export function slugify(str: unknown) { return str ? str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ''; }

export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { ready: true } }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID }; }
export default { formatCurrency, formatNumber, formatDate, formatTime, formatPercentage, truncate, capitalize, slugify };
