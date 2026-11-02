// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/core/normalizer
// PURPOSE: Telemetry Core - Event Normalizer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getTimestamp, getTimestampMs, buildTimestamp, mergeContext, normalizeSeverity, truncateString, sanitizeStack, getBrowserInfo, getCurrentRoute from ../utils/helpers.js
//   generateTraceId from ../utils/uuid.js
//   getSessionId, getBootId, getContext from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   normalizeEvent() — exported function
//   normalizeMetric() — exported function
//   normalizeError() — exported function
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
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { getTimestamp, getTimestampMs, buildTimestamp, mergeContext, normalizeSeverity, truncateString, sanitizeStack, getBrowserInfo, getCurrentRoute } from '../utils/helpers.js';
import { generateTraceId } from '../utils/uuid.js';
import { getSessionId, getBootId, getContext } from '../state/store.js';
export const VERSION = '5.1.0-ENTERPRISE';
const MODULE_ID = 'telemetry-core/core/normalizer';
let _debug = false; let _logBuffer: unknown[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level !== 'error') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
const _metrics = { eventCount: 0, metricCount: 0, errorCount: 0, sanitizeCount: 0 };
export function normalizeEvent(name: string, data: Record<string, any> = {}, options: Record<string, any> = {}) { _metrics.eventCount++; const globalContext = getContext(); const route = getCurrentRoute(); const ts = buildTimestamp(); return { timestamp: ts.timestampUtc, timestampISO: ts.isoUtc, localTime: ts.localTime, timeZone: ts.timeZone, type: 'event', event: name, component: options.component || data.component || 'unknown', severity: normalizeSeverity(options.severity || 'info'), traceId: options.traceId || generateTraceId(), sessionId: getSessionId(), bootId: getBootId(), context: mergeContext(globalContext, { route: route.path, hash: route.hash, ...options.context }), data: sanitizeData(data) }; }
export function normalizeMetric(name: string, data: Record<string, any> = {}, options: Record<string, any> = {}) { _metrics.metricCount++; const globalContext = getContext(); const route = getCurrentRoute(); const ts = buildTimestamp(); const metricValue = typeof data.value === 'number' ? data.value : (typeof data.duration === 'number' ? data.duration : 0); return { timestamp: ts.timestampUtc, timestampISO: ts.isoUtc, localTime: ts.localTime, timeZone: ts.timeZone, type: 'metric', event: name, component: options.component || data.component || data.panel || 'unknown', severity: normalizeSeverity(options.severity || 'info'), traceId: options.traceId || generateTraceId(), sessionId: getSessionId(), bootId: getBootId(), context: mergeContext(globalContext, { route: route.path, ...options.context }), metric: { name, value: metricValue, unit: data.unit || options.unit || 'ms' }, data: sanitizeData(data) }; }
export function normalizeError(name: string, data: Record<string, any> = {}, options: Record<string, any> = {}) { _metrics.errorCount++; const globalContext = getContext(); const route = getCurrentRoute(); const browserInfo = getBrowserInfo(); const ts = buildTimestamp(); let errorMessage = '', errorStack = ''; if (data instanceof Error) { errorMessage = data.message; errorStack = sanitizeStack(data.stack) as string; data = { originalError: data.name }; } else if (data.error instanceof Error) { errorMessage = data.error.message; errorStack = sanitizeStack(data.error.stack) as string; } else { errorMessage = data.message || data.error || String(data); errorStack = data.stack || ''; } return { timestamp: ts.timestampUtc, timestampISO: ts.isoUtc, localTime: ts.localTime, timeZone: ts.timeZone, type: 'error', event: name, component: options.component || data.component || 'unknown', severity: normalizeSeverity(options.severity || 'error'), traceId: options.traceId || generateTraceId(), sessionId: getSessionId(), bootId: getBootId(), context: mergeContext(globalContext, { route: route.path, userAgent: browserInfo.userAgent, online: browserInfo.online, ...options.context }), error: { message: truncateString(errorMessage, 1000), stack: truncateString(errorStack, 2000), code: data.code || options.code || 'UNKNOWN' }, data: sanitizeData(data) }; }
function sanitizeData(data: Record<string, unknown>) { _metrics.sanitizeCount++; if (!data || typeof data !== 'object') return {}; const sanitized: Record<string, unknown> = {}; const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization']; for (const key in data) { if (!Object.prototype.hasOwnProperty.call(data, key)) continue; if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) continue; if (key === 'error' && data[key] instanceof Error) continue; const value = data[key]; if (typeof value === 'string') sanitized[key] = truncateString(value, 500); else if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) sanitized[key] = value; else if (Array.isArray(value)) sanitized[key] = value.slice(0, 20); else if (typeof value === 'object') sanitized[key] = '[object]'; } return sanitized; }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics.eventCount = 0; _metrics.metricCount = 0; _metrics.errorCount = 0; _metrics.sanitizeCount = 0; }
export function getLogs() { return [..._logBuffer]; }
export function healthCheck() { const buildTimestampAvailable = typeof buildTimestamp === 'function'; const checks = { storeAvailable: typeof getSessionId === 'function', helpersAvailable: typeof getTimestamp === 'function', buildTimestampAvailable }; const passed = Object.values(checks).filter(Boolean).length; const ts = buildTimestamp(); return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 3, scoreDisplay: `${passed}/3`, checks, issues: null as unknown | null, version: VERSION, moduleId: MODULE_ID, timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone }; }
export function info() { const ts = buildTimestamp(); return { version: VERSION, moduleId: MODULE_ID, metrics: { ..._metrics }, healthCheck: healthCheck(), timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone }; }
export default { normalizeEvent, normalizeMetric, normalizeError, getVersion, setDebug, getMetrics, resetMetrics, getLogs, healthCheck, info };
