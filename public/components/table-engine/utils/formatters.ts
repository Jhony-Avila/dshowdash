// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:formatters
// PURPOSE: Table Engine - Internal Formatters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatCurrency() — exported function
//   formatNumber() — exported function
//   formatPercent() — exported function
//   formatDate() — exported function
//   formatDateTime() — exported function
//   formatTime() — exported function
//   formatCNPJ() — exported function
//   formatCPF() — exported function
//   formatPhone() — exported function
//   formatCEP() — exported function
//   formatBoolean() — exported function
//   formatStatus() — exported function
//   truncate() — exported function
//   escapeHtml() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:formatters';

export function formatCurrency(value: string | number | null | undefined, locale = 'pt-BR', currency = 'BRL') {
  if (value == null || isNaN(Number(value))) return 'R$ 0,00';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value));
}

export function formatNumber(value: string | number | null | undefined, locale = 'pt-BR', decimals = 2) {
  if (value == null || isNaN(Number(value))) return '0';
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value));
}

export function formatPercent(value: string | number | null | undefined, locale = 'pt-BR', decimals = 1) {
  if (value == null || isNaN(Number(value))) return '0%';
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value) / 100);
}

export function formatDate(value: string | number | Date | null | undefined, locale = 'pt-BR') {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(locale);
}

export function formatDateTime(value: string | number | Date | null | undefined, locale = 'pt-BR') {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString(locale);
}

export function formatTime(value: string | number | Date | null | undefined, locale = 'pt-BR') {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatCNPJ(value: string | number | null | undefined) {
  if (!value) return '-';
  const clean = String(value).replace(/\D/g, '').padStart(14, '0');
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatCPF(value: string | number | null | undefined) {
  if (!value) return '-';
  const clean = String(value).replace(/\D/g, '').padStart(11, '0');
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

export function formatPhone(value: string | number | null | undefined) {
  if (!value) return '-';
  const clean = String(value).replace(/\D/g, '');
  if (clean.length === 11) return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (clean.length === 10) return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return value;
}

export function formatCEP(value: string | number | null | undefined) {
  if (!value) return '-';
  const clean = String(value).replace(/\D/g, '').padStart(8, '0');
  return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

export function formatBoolean(value: unknown, trueLabel = 'Sim', falseLabel = 'Não') {
  return value ? trueLabel : falseLabel;
}

export function formatStatus(value: string, statusMap: Record<string, string> = {}) {
  return statusMap[value] || value || '-';
}

export function truncate(value: string | null | undefined, maxLength = 50, suffix = '...') {
  if (!value) return '';
  const str = String(value);
  return str.length > maxLength ? str.slice(0, maxLength - suffix.length) + suffix : str;
}

export function escapeHtml(str: string | number | null | undefined) {
  if (!str) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, (c: string) => map[c as keyof typeof map]);
}

export default { formatCurrency, formatNumber, formatPercent, formatDate, formatDateTime, formatTime, formatCNPJ, formatCPF, formatPhone, formatCEP, formatBoolean, formatStatus, truncate, escapeHtml, VERSION, MODULE_ID };
