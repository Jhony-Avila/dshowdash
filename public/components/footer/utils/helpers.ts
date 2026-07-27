// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-utils-helpers
// PURPOSE: Footer Utils - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatTime() — exported function
//   formatDate() — exported function
//   formatDuration() — exported function
//   debounce() — exported function
//   throttle() — exported function
//   generateId() — exported function
//   safeJsonParse() — exported function
//   getMetrics() — exported function
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '6.2.0-ENTERPRISE';
export const MODULE_ID = 'footer-utils-helpers';

const _metrics = { formatCalls: 0, idGenerated: 0 };

export function formatTime(timestamp: number, locale: string) {
  locale = locale || 'pt-BR';
  _metrics.formatCalls++;
  const date = new Date(timestamp);
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(timestamp: number, locale: string) {
  locale = locale || 'pt-BR';
  _metrics.formatCalls++;
  const date = new Date(timestamp);
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDuration(ms: unknown) {
  _metrics.formatCalls++;
  // @ts-expect-error TS migration - TS2362
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function debounce(this: any, fn: Function, delay: number) {
  delay = delay || 300;
  // @ts-expect-error strict migration — TS7034
  let timeoutId;
  return function() {
    const args = arguments;
    // @ts-expect-error strict migration — TS2683
    const self = this;
    // @ts-expect-error strict migration — TS7005
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => { fn.apply(self, args); }, delay);
  };
}

export function throttle(this: any, fn: Function, limit: number) {
  limit = limit || 300;
  // @ts-expect-error strict migration — TS7034
  let inThrottle;
  return function() {
    const args = arguments;
    // @ts-expect-error strict migration — TS2683
    const self = this;
    // @ts-expect-error strict migration — TS7005
    if (!inThrottle) {
      fn.apply(self, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

export function generateId(prefix: string) {
  prefix = prefix || 'footer';
  _metrics.idGenerated++;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function safeJsonParse(str: unknown, fallback: unknown) {
  fallback = fallback === undefined ? null : fallback;
  // @ts-expect-error TS migration - TS2345
  try { return JSON.parse(str); } catch (e) { return fallback; }
}

export function getMetrics() { return { formatCalls: _metrics.formatCalls, idGenerated: _metrics.idGenerated }; }
export function getVersion() { return VERSION; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { helpersReady: true }, metrics: getMetrics() }; }

export default { formatTime, formatDate, formatDuration, debounce, throttle, generateId, safeJsonParse, getMetrics, getVersion, info, healthCheck, VERSION, MODULE_ID };
