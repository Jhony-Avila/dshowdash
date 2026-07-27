// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: formatters
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   formatCurrency() — exported function
//   formatDate() — exported function
//   formatPercentage() — exported function
//   formatNumber() — exported function
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

export const MODULE_ID = 'panel-enterprise.utils.formatters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Enterprise - Formatters
 * @module panel-enterprise/utils/formatters
 * @version 1.1.0-AAA
 */

export function formatCurrency(value: number, locale = 'pt-BR', currency = 'BRL') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatDate(date: string | number | Date, locale = 'pt-BR') {
    return new Intl.DateTimeFormat(locale).format(new Date(date));
}

export function formatPercentage(value: number, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number, locale = 'pt-BR') {
    return new Intl.NumberFormat(locale).format(value);
}
