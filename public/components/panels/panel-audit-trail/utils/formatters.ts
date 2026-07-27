

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail-formatters
// PURPOSE: Panel Audit Trail - Formatters Enterprise AAA
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
//   formatCompactDate() — exported function
//   formatJson() — exported function
//   truncate() — exported function
//   escapeHtml() — exported function
//   slugify() — exported function
//   capitalize() — exported function
//   formatBytes() — exported function
//   formatNumber() — exported function
//   formatPercent() — exported function
//   ... and 9 more exports
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
export const MODULE_ID = 'panel-audit-trail-formatters';

const TIMEZONE = 'America/Sao_Paulo';
const LOCALE = 'pt-BR';

export function formatTimestamp(ts: string | number | Date | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
  if (!ts) return '-';
  
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    
    const defaultOptions = {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    
    return date.toLocaleString(LOCALE, { ...defaultOptions, ...options } as any);
  } catch (e) {
    return String(ts);
  }
}

export function formatDateOnly(ts: string | number | Date | null | undefined) {
  if (!ts) return '-';
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    return date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE });
  } catch (e) {
    return String(ts);
  }
}

export function formatTimeOnly(ts: string | number | Date | null | undefined) {
  if (!ts) return '-';
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    return date.toLocaleTimeString(LOCALE, { timeZone: TIMEZONE });
  } catch (e) {
    return String(ts);
  }
}

export function formatRelativeTime(ts: string | number | Date | null | undefined) {
  if (!ts) return '-';
  
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 10) return 'agora';
    if (diffSec < 60) return `${diffSec}s atrás`;
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHour < 24) return `${diffHour}h atrás`;
    if (diffDay < 7) return `${diffDay}d atrás`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} sem atrás`;
    
    return formatDateOnly(ts);
  } catch (e) {
    return String(ts);
  }
}

export function formatCompactDate(ts: string | number | Date | null | undefined) {
  if (!ts) return '-';
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString(LOCALE, { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' });
    }
    if (isYesterday) {
      return `Ontem ${date.toLocaleTimeString(LOCALE, { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return String(ts);
  }
}

export function formatJson(obj: unknown, pretty = true) {
  if (obj === null || obj === undefined) return '-';
  try {
    if (typeof obj === 'string') {
      try {
        const parsed = JSON.parse(obj);
        return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      } catch (e) {
        return obj;
      }
    }
    return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  } catch (e) {
    return String(obj);
  }
}

export function truncate(str: string | null | undefined, maxLen = 100, suffix = '...') {
  if (!str) return '';
  const s = String(str);
  if (s.length <= maxLen) return s;
  return s.substring(0, maxLen - suffix.length) + suffix;
}

export function escapeHtml(str: string | null | undefined) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

export function slugify(str: string | null | undefined) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function capitalize(str: string | null | undefined) {
  if (!str) return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase();
}

export function formatBytes(bytes: number | null | undefined, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatNumber(num: number | null | undefined, options: Intl.NumberFormatOptions = {}) {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat(LOCALE, options).format(num);
}

export function formatPercent(num: number | null | undefined, decimals = 1) {
  if (num === null || num === undefined) return '-';
  return `${num.toFixed(decimals)}%`;
}

export function formatDuration(ms: number | null | undefined) {
  if (!ms || ms < 0) return '-';
  
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export function maskSensitiveData(str: string | null | undefined, visibleStart = 4, visibleEnd = 0) {
  if (!str) return '';
  const s = String(str);
  
  if (s.length <= visibleStart + visibleEnd) {
    return '*'.repeat(s.length);
  }
  
  const start = s.substring(0, visibleStart);
  const end = visibleEnd > 0 ? s.substring(s.length - visibleEnd) : '';
  const maskLen = Math.min(s.length - visibleStart - visibleEnd, 8);
  
  return start + '*'.repeat(maskLen) + end;
}

export function maskEmail(email: string | null | undefined) {
  if (!email || !email.includes('@')) return maskSensitiveData(email);
  
  const [local, domain] = email.split('@');
  let maskedLocal;
  
  if (local.length > 2) {
    const maskLen = Math.min(local.length - 2, 5);
    maskedLocal = local[0] + '*'.repeat(maskLen) + local[local.length - 1];
  } else {
    maskedLocal = '*'.repeat(local.length);
  }
  
  return `${maskedLocal}@${domain}`;
}

export function maskIP(ip: string | null | undefined) {
  if (!ip) return '-';
  const parts = String(ip).split('.');
  if (parts.length !== 4) return maskSensitiveData(ip);
  return `${parts[0]}.${parts[1]}.***.***`;
}

export function getSeverityLabel(severity: string | null | undefined) {
  const labels: Record<string, string> = {
    'INFO': 'Info',
    'WARNING': 'Warning',
    'WARN': 'Warning',
    'ERROR': 'Error',
    'CRITICAL': 'Critical',
    'SECURITY': 'Security'
  };
  return labels[(severity || '').toUpperCase()] || severity || '-';
}

export function getActionLabel(action: string | null | undefined) {
  const labels: Record<string, string> = {
    'CREATE': 'Criar',
    'READ': 'Ler',
    'UPDATE': 'Atualizar',
    'DELETE': 'Excluir',
    'LOGIN': 'Login',
    'LOGOUT': 'Logout',
    'GRANT': 'Conceder',
    'REVOKE': 'Revogar',
    'EXECUTE': 'Executar'
  };
  return labels[(action || '').toUpperCase()] || action || '-';
}

export function getVersion() { return VERSION; }

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    formattersCount: 18
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      formatTimestampReady: typeof formatTimestamp === 'function',
      formatJsonReady: typeof formatJson === 'function',
      maskSensitiveDataReady: typeof maskSensitiveData === 'function'
    }
  };
}

export default {
  VERSION, 
  MODULE_ID,
  formatTimestamp, 
  formatDateOnly, 
  formatTimeOnly, 
  formatRelativeTime, 
  formatCompactDate,
  formatJson, 
  truncate, 
  escapeHtml, 
  slugify, 
  capitalize,
  formatBytes, 
  formatNumber, 
  formatPercent, 
  formatDuration,
  maskSensitiveData, 
  maskEmail, 
  maskIP,
  getSeverityLabel, 
  getActionLabel,
  getVersion,
  info,
  healthCheck
};
