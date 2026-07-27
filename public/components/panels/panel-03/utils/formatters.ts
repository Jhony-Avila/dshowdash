// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-03/utils/formatters
// PURPOSE: Panel-03 - Formatters Centralizados
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatDuration() — exported function
//   formatDateTime() — exported function
//   formatDateTimeFull() — exported function
//   escapeHtml() — exported function
//   formatNumber() — exported function
//   formatPercent() — exported function
//   formatBytes() — exported function
//   getRateClass() — exported function
//   getHealthClass() — exported function
//   getHealthText() — exported function
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
export const MODULE_ID = 'panel-03/utils/formatters';

export const formatDuration = (seconds: unknown) => { if (!seconds || seconds === '--') return '--'; const num = parseFloat(String(seconds)); if (isNaN(num)) return '--'; if (num < 1) return `${(num * 1000).toFixed(0)}ms`; if (num < 60) return `${num.toFixed(1)}s`; const minutes = Math.floor(num / 60); const secs = Math.round(num % 60); return `${minutes}m ${secs}s`; };

export const formatDateTime = (dateString: string, options: Record<string, unknown> = {}) => {
  if (!dateString || dateString === '--') return '--';

  // @ts-expect-error TS migration - TS2769
  try { const date = new Date(dateString); if (isNaN(date.getTime())) return '--'; const defaultOptions = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }; Object.keys(options).forEach(k => { defaultOptions[k] = options[k]; }); return date.toLocaleString('pt-BR', defaultOptions); }
  catch (e) { return '--'; }
};

export const formatDateTimeFull = (dateString: string) => formatDateTime(dateString, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const escapeHtml = (text: unknown) => { if (text === null || text === undefined) return ''; const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return String(text).replace(/[&<>"']/g, m => map[m]); };

export const formatNumber = (num: unknown) => { if (num === null || num === undefined) return '--'; const parsed = typeof num === 'number' ? num : parseInt(String(num)); if (isNaN(parsed)) return '--'; return parsed.toLocaleString('pt-BR'); };

export const formatPercent = (value: unknown, decimals = 1) => { if (value === null || value === undefined) return '--'; const num = parseFloat(String(value)); if (isNaN(num)) return '--'; return `${num.toFixed(decimals)}%`; };

export const formatBytes = (bytes: number) => { if (!bytes || bytes === 0) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`; };

export const getRateClass = (rate: unknown, threshold = 95) => { const num = parseFloat(String(rate)); if (isNaN(num)) return ''; if (num >= threshold) return 'high'; if (num >= 80) return 'medium'; return 'low'; };

export const getHealthClass = (health: string) => { const map: Record<string, string> = { 'healthy': 'status-active', 'warning': 'status-warning', 'critical': 'status-error', 'inactive': 'status-inactive' }; return map[health] || 'status-inactive'; };

export const getHealthText = (health: string) => { const map: Record<string, string> = { 'healthy': 'Saudável', 'warning': 'Atenção', 'critical': 'Crítico', 'inactive': 'Inativo' }; return map[health] || 'Inativo'; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: typeof formatDuration === 'function' } });

export default { formatDuration, formatDateTime, formatDateTimeFull, escapeHtml, formatNumber, formatPercent, formatBytes, getRateClass, getHealthClass, getHealthText, info, healthCheck };
