// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-manager-polling
// PURPOSE: Notification Manager - Polling v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   start() — exported function
//   stop() — exported function
//   isRunning() — exported function
//   getMetrics() — exported function
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
export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'notification-manager-polling';
let _interval: ReturnType<typeof setInterval> | null = null;
let _metrics = { pollCount: 0 };
export function start(callback?: (() => void), intervalMs = 30000) { if (_interval) stop(); _interval = setInterval(() => { if (document.hidden) return; _metrics.pollCount++; callback?.(); }, intervalMs); return true; }
export function stop() { if (_interval) { clearInterval(_interval); _interval = null; } }
export function isRunning() { return !!_interval; }
export function getMetrics() { return { ..._metrics }; }
export function healthCheck() { const checks = { running: !!_interval }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, running: isRunning(), metrics: getMetrics(), timestamp: Date.now() }; }
export const startPolling = start;
export const stopPolling = stop;
export function restartPolling() { stop(); }
export const isPollingActive = isRunning;
export function setPollingInterval(ms: number) { return; }
export function forcePoll() { return; }
export default { start, stop, isRunning, getMetrics, healthCheck, info, VERSION, MODULE_ID };
