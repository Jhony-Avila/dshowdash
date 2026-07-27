// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-13:utils:formatters
// PURPOSE: Panel-13 - Formatters
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
//   formatDuration() — exported function (alias)
//   getHealthClass() — exported function (alias)
//   getHealthText() — exported function (alias)
//   getRateClass() — exported function (alias)
//   escape() — exported function
//   truncate() — exported function
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
export const MODULE_ID = 'panel-13:utils:formatters';

export const formatCurrency = (value: number | string | null | undefined, currency = 'BRL') => {
  if (value == null) return '--';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return num.toLocaleString('pt-BR', { style: 'currency', currency });
};

export const formatNumber = (value: number | string | null | undefined) => {
  if (value == null) return '--';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return num.toLocaleString('pt-BR');
};

export const formatPercent = (value: number | string | null | undefined, decimals = 1) => {
  if (value == null) return '--';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return `${num.toFixed(decimals)}%`;
};

export const formatDate = (date: string | null | undefined) => {
  if (!date) return '--';
  try { return new Date(date).toLocaleDateString('pt-BR'); } catch (e) { return date; }
};

export const formatDateTime = (date: string | null | undefined) => {
  if (!date) return '--';
  try { return new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return date; }
};

export const escape = (str: string | null | undefined) => {
  if (!str) return '';
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, (m: string) => map[m]);
};

export const truncate = (str: string | null | undefined, maxLength = 50) => {
  if (!str) return '';
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

// ── Alias exports ─────────────────────────────────────────────
// These aliases satisfy consumers that import these names directly.

/** Formats a duration in seconds to a human-readable string (e.g. "1h 23m 45s"). */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null || isNaN(Number(seconds))) return '--';
  const total = Math.floor(Number(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

/** Returns a CSS class name based on a health status string. */
export const getHealthClass = (status: string | null | undefined): string => {
  if (!status) return 'health-unknown';
  const normalized = String(status).toUpperCase();
  if (normalized === 'HEALTHY' || normalized === 'OK' || normalized === 'UP') return 'health-ok';
  if (normalized === 'DEGRADED' || normalized === 'WARN' || normalized === 'WARNING') return 'health-warn';
  if (normalized === 'CRITICAL' || normalized === 'ERROR' || normalized === 'DOWN') return 'health-critical';
  return 'health-unknown';
};

/** Returns a display label for a health status string. */
export const getHealthText = (status: string | null | undefined): string => {
  if (!status) return 'Desconhecido';
  const normalized = String(status).toUpperCase();
  if (normalized === 'HEALTHY' || normalized === 'OK' || normalized === 'UP') return 'Saudável';
  if (normalized === 'DEGRADED' || normalized === 'WARN' || normalized === 'WARNING') return 'Degradado';
  if (normalized === 'CRITICAL' || normalized === 'ERROR' || normalized === 'DOWN') return 'Crítico';
  return String(status);
};

/** Returns a CSS class name based on a rate/percentage value. */
export const getRateClass = (rate: number | null | undefined, warnThreshold = 75, criticalThreshold = 90): string => {
  if (rate == null || isNaN(Number(rate))) return 'rate-unknown';
  const n = Number(rate);
  if (n >= criticalThreshold) return 'rate-critical';
  if (n >= warnThreshold) return 'rate-warn';
  return 'rate-ok';
};

export default { formatCurrency, formatNumber, formatPercent, formatDate, formatDateTime, formatDuration, getHealthClass, getHealthText, getRateClass, escape, truncate, info, healthCheck };
