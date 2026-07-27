// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.9.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-17/utils/formatters
// PURPOSE: Panel 17 - Formatters Utility
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//   escapeHtml() — exported function
//   formatDatetime() — exported function
//   formatDuration() — exported function
//   formatPercentage() — exported function
//   formatNumber() — exported function
//   normalizeText() — exported function
//   truncate() — exported function
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
export const MODULE_ID = 'panel-17/utils/formatters';
const escapeHtml = (text: unknown) => { if (!text) return ''; const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return String(text).replace(/[&<>"']/g, m => map[m]); };
const formatDatetime = (datetime: string | null | undefined) => { if (!datetime) return '--'; try { const date = new Date(datetime); if (isNaN(date.getTime())) return '--'; return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return '--'; } };
const formatDuration = (seconds: unknown) => { if (!seconds || isNaN(Number(seconds))) return '--'; const num = parseFloat(String(seconds)); if (num < 60) return `${num.toFixed(2)}s`; return `${Math.floor(num / 60)}m ${Math.floor(num % 60)}s`; };
const formatPercentage = (value: unknown, decimals = 2) => `${(parseFloat(String(value)) || 0).toFixed(decimals)}%`;
const formatNumber = (num: unknown) => (!num || isNaN(Number(num))) ? '0' : parseInt(String(num)).toLocaleString('pt-BR');
const normalizeText = (text: unknown) => text ? String(text).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') : '';
const truncate = (text: unknown, maxLength = 50, suffix = '...') => { if (!text) return ''; const str = String(text); return str.length <= maxLength ? str : str.substring(0, maxLength - suffix.length) + suffix; };
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: true }, timestamp: Date.now() });
export function getVersion() { return VERSION; }
// Alias: formatDateTime (camelCase) → formatDatetime (internal name)
export const formatDateTime = formatDatetime;

// Health status helpers
export const getHealthClass = (health: string): string => {
  const h = String(health || '').toLowerCase();
  if (h === 'active' || h === 'healthy' || h === 'ok') return 'status-active';
  if (h === 'warning' || h === 'degraded') return 'status-warning';
  if (h === 'error' || h === 'unhealthy' || h === 'critical') return 'status-error';
  return 'status-inactive';
};

export const getHealthText = (health: string): string => {
  const h = String(health || '').toLowerCase();
  if (h === 'active' || h === 'healthy' || h === 'ok') return 'Ativo';
  if (h === 'warning' || h === 'degraded') return 'Alerta';
  if (h === 'error' || h === 'unhealthy' || h === 'critical') return 'Erro';
  return 'Inativo';
};

export const getRateClass = (rate: number): string => {
  const r = parseFloat(String(rate)) || 0;
  if (r >= 95) return 'high';
  if (r >= 80) return 'medium';
  return 'low';
};

export { escapeHtml, formatDatetime, formatDuration, formatPercentage, formatNumber, normalizeText, truncate };
