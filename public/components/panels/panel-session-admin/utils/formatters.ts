// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin-formatters
// PURPOSE: Panel Session Admin - Formatters Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatTimestamp() — exported function
//   formatDateOnly() — exported function
//   formatTimeOnly() — exported function
//   formatRelativeTime() — exported function
//   formatExpiresAt() — exported function
//   escapeHtml() — exported function
//   truncate() — exported function
//   capitalize() — exported function
//   formatDeviceType() — exported function
//   formatBrowser() — exported function
//   formatOS() — exported function
//   formatIP() — exported function
//   maskIP() — exported function
//   ... and 6 more exports
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
export const MODULE_ID = 'panel-session-admin-formatters';

const TIMEZONE = 'America/Sao_Paulo';
const LOCALE = 'pt-BR';

export function formatTimestamp(ts: string | number, options: Record<string, string> = {}) {
  if (!ts) return '-';
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    const defaultOptions: Record<string, string> = { timeZone: TIMEZONE, day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' };
    for (const k in options) { if (Object.prototype.hasOwnProperty.call(options, k)) defaultOptions[k] = options[k]; }
    return date.toLocaleString(LOCALE, defaultOptions as Intl.DateTimeFormatOptions);
  } catch (e) { return String(ts); }
}

export function formatDateOnly(ts: string | number) {
  if (!ts) return '-';
  try { const date = new Date(ts); if (isNaN(date.getTime())) return String(ts); return date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE }); }
  catch (e) { return String(ts); }
}

export function formatTimeOnly(ts: string | number) {
  if (!ts) return '-';
  try { const date = new Date(ts); if (isNaN(date.getTime())) return String(ts); return date.toLocaleTimeString(LOCALE, { timeZone: TIMEZONE }); }
  catch (e) { return String(ts); }
}

export function formatRelativeTime(ts: string | number) {
  if (!ts) return '-';
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    const now = new Date();

    // @ts-expect-error TS migration - TS2362, TS2363
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 10) return 'Agora';
    if (diffSec < 60) return `${diffSec}s atrás`;
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffHour < 24) return `${diffHour}h atrás`;
    if (diffDay < 7) return `${diffDay}d atrás`;
    return formatDateOnly(ts);
  } catch (e) { return String(ts); }
}

export function formatExpiresAt(ts: string | number) {
  if (!ts) return '-';
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    const now = new Date();
    if (date < now) return 'Expirada';

    // @ts-expect-error TS migration - TS2362, TS2363
    const diffMs = date - now;
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffHour / 24);
    if (diffHour < 1) return 'Em breve';
    if (diffHour < 24) return `Em ${diffHour}h`;
    return `Em ${diffDay}d`;
  } catch (e) { return String(ts); }
}

export function escapeHtml(str: string) { if (!str) return ''; const div = document.createElement('div'); div.textContent = String(str); return div.innerHTML; }

export function truncate(str: string, maxLen: number = 50, suffix: string = '...') { if (!str) return ''; const s = String(str); if (s.length <= maxLen) return s; return s.substring(0, maxLen - suffix.length) + suffix; }

export function capitalize(str: string) { if (!str) return ''; return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase(); }

export function formatDeviceType(deviceType: string) { const type = (deviceType || 'desktop').toLowerCase(); if (type.indexOf('mobile') !== -1 || type.indexOf('phone') !== -1) return 'Mobile'; if (type.indexOf('tablet') !== -1) return 'Tablet'; return 'Desktop'; }

export function formatBrowser(browser: string) { if (!browser) return '-'; const b = String(browser).toLowerCase(); if (b.indexOf('chrome') !== -1) return 'Chrome'; if (b.indexOf('firefox') !== -1) return 'Firefox'; if (b.indexOf('safari') !== -1) return 'Safari'; if (b.indexOf('edge') !== -1) return 'Edge'; if (b.indexOf('opera') !== -1) return 'Opera'; return capitalize(browser); }

export function formatOS(os: string) { if (!os) return '-'; const o = String(os).toLowerCase(); if (o.indexOf('windows') !== -1) return 'Windows'; if (o.indexOf('mac') !== -1 || o.indexOf('darwin') !== -1) return 'macOS'; if (o.indexOf('linux') !== -1) return 'Linux'; if (o.indexOf('android') !== -1) return 'Android'; if (o.indexOf('ios') !== -1 || o.indexOf('iphone') !== -1 || o.indexOf('ipad') !== -1) return 'iOS'; return capitalize(os); }

export function formatIP(ip: string) { if (!ip) return '-'; return String(ip); }

export function maskIP(ip: string, level: string = 'partial') { if (!ip) return '-'; const parts = String(ip).split('.'); if (parts.length !== 4) return ip; if (level === 'full') return `***.***.***.${parts[3]}`; return `${parts[0]}.${parts[1]}.***.***`; }

export function formatStatus(isActive: boolean, isCurrent: boolean) { if (isCurrent) return 'Atual'; if (isActive) return 'Ativa'; return 'Inativa'; }

export function getStatusClass(isActive: boolean, isCurrent: boolean) { if (isCurrent) return 'psa__badge--info'; if (isActive) return 'psa__badge--success'; return 'psa__badge--muted'; }

export function formatSessionSummary(sessions: Record<string, unknown>[]) { const total = sessions ? sessions.length : 0; let active = 0, current = 0; if (sessions) { for (let i = 0; i < sessions.length; i++) { if (sessions[i].is_active) active++; if (sessions[i].is_current) current++; } } return { total, active, current, inactive: total - active }; }

export function getVersion() { return VERSION; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { formatTimestampReady: typeof formatTimestamp === 'function', escapeHtmlReady: typeof escapeHtml === 'function' } }; }

export default { VERSION, MODULE_ID, formatTimestamp, formatDateOnly, formatTimeOnly, formatRelativeTime, formatExpiresAt, escapeHtml, truncate, capitalize, formatDeviceType, formatBrowser, formatOS, formatIP, maskIP, formatStatus, getStatusClass, formatSessionSummary, getVersion, info, healthCheck };
