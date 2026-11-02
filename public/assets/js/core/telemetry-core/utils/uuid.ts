// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/utils/uuid
// PURPOSE: Telemetry Core - UUID Generator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   generateUUID() — exported function
//   generateTraceId() — exported function
//   generateSessionId() — exported function
//   generateBootId() — exported function
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
export const VERSION = '5.1.0-ENTERPRISE';
const MODULE_ID = 'telemetry-core/utils/uuid';
let _debug = false; let _logBuffer: unknown[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level !== 'error') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
const _metrics = { uuidCount: 0, traceCount: 0, sessionCount: 0, bootCount: 0 };
export function generateUUID() { _metrics.uuidCount++; if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; const v = c === 'x' ? r : (r & 0x3) | 0x8; return v.toString(16); }); }
export function generateTraceId() { _metrics.traceCount++; return `tr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`; }
export function generateSessionId() { _metrics.sessionCount++; return `ses-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`; }
export function generateBootId() { _metrics.bootCount++; return `boot-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`; }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; _log('info', `Debug: ${_debug}`); }
export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics.uuidCount = 0; _metrics.traceCount = 0; _metrics.sessionCount = 0; _metrics.bootCount = 0; }
export function getLogs() { return [..._logBuffer]; }
export function healthCheck() { const checks = { cryptoAvailable: typeof crypto !== 'undefined', randomUUIDAvailable: typeof crypto?.randomUUID === 'function' }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, issues: passed < 2 ? ['crypto.randomUUID not available, using fallback'] : null, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, metrics: { ..._metrics }, healthCheck: healthCheck(), timestamp: new Date().toISOString() }; }
export default { generateUUID, generateTraceId, generateSessionId, generateBootId, getVersion, setDebug, getMetrics, resetMetrics, getLogs, healthCheck, info };
