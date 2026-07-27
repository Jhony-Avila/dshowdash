// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-bling/utils/formatters
// PURPOSE: panel-bling - Formatters (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatCurrency() — exported function
//   formatNumber() — exported function
//   formatDate() — exported function
//   formatTime() — exported function
//   formatPercentage() — exported function
//   truncate() — exported function
//   capitalize() — exported function
//   slugify() — exported function
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

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-bling/utils/formatters';

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
