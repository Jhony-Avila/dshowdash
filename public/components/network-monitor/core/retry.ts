// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: network-monitor-retry
// PURPOSE: Network Monitor - Retry v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   withRetry() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
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
export const MODULE_ID = 'network-monitor-retry';
let _metrics = { retries: 0, successes: 0, failures: 0 };
export async function withRetry(fn: () => Promise<unknown>, options: { maxAttempts?: number; delay?: number; backoff?: number } = {}) { const { maxAttempts = 3, delay = 1000, backoff = 2 } = options; for (let attempt = 1; attempt <= maxAttempts; attempt++) { try { _metrics.retries++; const result = await fn(); _metrics.successes++; return result; } catch (e) { if (attempt === maxAttempts) { _metrics.failures++; throw e; } await new Promise(r => setTimeout(r, delay * Math.pow(backoff, attempt - 1))); } } }
export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics = { retries: 0, successes: 0, failures: 0 }; }
export function healthCheck() { const checks = { lowFailureRate: _metrics.retries === 0 || (_metrics.failures / _metrics.retries) < 0.3 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), timestamp: Date.now() }; }
export default { withRetry, getMetrics, resetMetrics, healthCheck, info, VERSION, MODULE_ID };
