// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/utils/helpers
// PURPOSE: Telemetry Core - Helper Functions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   nowUtcMs() — exported function
//   buildTimestamp() — exported function
//   getTimestamp() — exported function
//   getTimestampMs() — exported function
//   mergeContext() — exported function
//   safeStringify() — exported function
//   safeParse() — exported function
//   truncateString() — exported function
//   sanitizeStack() — exported function
//   getBrowserInfo() — exported function
//   getCurrentRoute() — exported function
//   isValidSeverity() — exported function
//   normalizeSeverity() — exported function
//   getVersion() — exported function
//   setDebug() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   getLogs() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.APP_CONFIG
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '5.1.0-ENTERPRISE';
const MODULE_ID = 'telemetry-core/utils/helpers';
let _debug = false; let _logBuffer: unknown[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level !== 'error') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
const _metrics = { stringifyCount: 0, parseCount: 0, truncateCount: 0, timestampCount: 0 };
export function nowUtcMs() { return Date.now(); }

// @ts-expect-error TS migration - TS2769
export function buildTimestamp(now = Date.now()) { _metrics.timestampCount++; const date = new Date(now); const timeZone = window.APP_CONFIG?.app?.timeZone || 'America/Sao_Paulo'; const locale = window.APP_CONFIG?.app?.locale || 'pt-BR'; let localTime = null; let localTimeFormatted = null; try { const fmtDisplay = new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); localTime = fmtDisplay.format(date); const fmtLog = new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'shortOffset' }); localTimeFormatted = fmtLog.format(date); } catch (e) { localTime = date.toLocaleString(locale); localTimeFormatted = localTime; } return { timestampUtc: now, isoUtc: date.toISOString(), localTime, localTimeFormatted, timeZone, locale }; }
export function getTimestamp() { return new Date().toISOString(); }
export function getTimestampMs() { return Date.now(); }
export function mergeContext(base: unknown, patch: unknown) { if (!patch || typeof patch !== 'object') return base; if (!base || typeof base !== 'object') return patch; const result = { ...(base as Record<string, unknown>) }; const patchObj = patch as Record<string, unknown>; for (const key in patchObj) { if (Object.prototype.hasOwnProperty.call(patchObj, key) && patchObj[key] !== undefined && patchObj[key] !== null) result[key] = patchObj[key]; } return result; }
export function safeStringify(obj: Record<string, unknown>, fallback = '{}') { _metrics.stringifyCount++; try { return JSON.stringify(obj); } catch { return fallback; } }
export function safeParse(str: string, fallback: unknown = null) { _metrics.parseCount++; try { return JSON.parse(str); } catch { return fallback; } }
export function truncateString(str: string, maxLength = 500) { if (typeof str !== 'string') return str; if (str.length <= maxLength) return str; _metrics.truncateCount++; return str.substring(0, maxLength) + '...[truncated]'; }
export function sanitizeStack(stack: unknown) { if (typeof stack !== 'string') return stack; return stack.split('\n').slice(0, 10).map(line => line.trim()).join('\n'); }
export function getBrowserInfo() { if (typeof navigator === 'undefined') return { userAgent: 'unknown', platform: 'unknown', language: 'unknown', online: true }; return { userAgent: navigator.userAgent || 'unknown', platform: navigator.platform || 'unknown', language: navigator.language || 'unknown', online: navigator.onLine !== undefined ? navigator.onLine : true }; }
export function getCurrentRoute() { if (typeof window === 'undefined' || !window.location) return { path: '/', hash: '', search: '' }; return { path: window.location.pathname || '/', hash: window.location.hash || '', search: window.location.search || '' }; }
export function isValidSeverity(severity: unknown): severity is string { return typeof severity === 'string' && ['debug', 'info', 'warn', 'error', 'critical'].includes(severity); }
export function normalizeSeverity(severity: unknown) { return isValidSeverity(severity) ? severity : 'info'; }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics.stringifyCount = 0; _metrics.parseCount = 0; _metrics.truncateCount = 0; _metrics.timestampCount = 0; }
export function getLogs() { return [..._logBuffer]; }
export function healthCheck() { const timeZone = window.APP_CONFIG?.app?.timeZone || 'America/Sao_Paulo'; const checks = { windowAvailable: typeof window !== 'undefined', navigatorAvailable: typeof navigator !== 'undefined', timeZoneConfigured: !!timeZone }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 3, scoreDisplay: `${passed}/3`, checks, issues: null as unknown | null, version: VERSION, moduleId: MODULE_ID, timeZone, timestamp: new Date().toISOString() }; }
export function info() { const timeZone = window.APP_CONFIG?.app?.timeZone || 'America/Sao_Paulo'; const locale = window.APP_CONFIG?.app?.locale || 'pt-BR'; return { version: VERSION, moduleId: MODULE_ID, metrics: { ..._metrics }, config: { timeZone, locale }, healthCheck: healthCheck(), timestamp: new Date().toISOString() }; }
export default { nowUtcMs, buildTimestamp, getTimestamp, getTimestampMs, mergeContext, safeStringify, safeParse, truncateString, sanitizeStack, getBrowserInfo, getCurrentRoute, isValidSeverity, normalizeSeverity, getVersion, setDebug, getMetrics, resetMetrics, getLogs, healthCheck, info };
