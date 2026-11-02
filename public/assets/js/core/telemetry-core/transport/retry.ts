// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/transport/retry
// PURPOSE: Telemetry Core - Retry Logic
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   calculateDelay() — exported function
//   shouldRetry() — exported function
//   incrementAttempt() — exported function
//   getAttemptCount() — exported function
//   clearAttempts() — exported function
//   cleanupOldAttempts() — exported function
//   configureRetry() — exported function
//   getRetryStats() — exported function
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
const MODULE_ID = 'telemetry-core/transport/retry';
let _debug = false; let _logBuffer: unknown[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level !== 'error') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
const retryState = { attempts: new Map(), maxRetries: 3, baseDelay: 1000, maxDelay: 30000, backoffMultiplier: 2 };
const _metrics = { retryCount: 0, successCount: 0, failCount: 0, lastRetryAt: null as unknown | null };
export function calculateDelay(attemptNumber: number) { const exponentialDelay = retryState.baseDelay * Math.pow(retryState.backoffMultiplier, attemptNumber - 1); const jitter = Math.random() * 0.3 * exponentialDelay; return Math.floor(Math.min(exponentialDelay + jitter, retryState.maxDelay)); }
export function shouldRetry(batchId: string, error: unknown) { const attempts = retryState.attempts.get(batchId) || 0; if (attempts >= retryState.maxRetries) { retryState.attempts.delete(batchId); _metrics.failCount++; return false; } const errObj = error as Record<string, unknown>; if (errObj && typeof errObj.status === 'number' && errObj.status >= 400 && errObj.status < 500 && errObj.status !== 429) { retryState.attempts.delete(batchId); _metrics.failCount++; return false; } return true; }
export function incrementAttempt(batchId: string) { _metrics.retryCount++; _metrics.lastRetryAt = new Date().toISOString(); const current = retryState.attempts.get(batchId) || 0; retryState.attempts.set(batchId, current + 1); return current + 1; }
export function getAttemptCount(batchId: string) { return retryState.attempts.get(batchId) || 0; }
export function clearAttempts(batchId: string) { _metrics.successCount++; retryState.attempts.delete(batchId); }
export function cleanupOldAttempts() { if (retryState.attempts.size > 100) { const entries = Array.from(retryState.attempts.entries()).slice(0, 50); entries.forEach(([key]) => retryState.attempts.delete(key)); } }
export function configureRetry(config: { maxRetries?: number; baseDelay?: number; maxDelay?: number; backoffMultiplier?: number } = {}) { if (config.maxRetries !== undefined) retryState.maxRetries = config.maxRetries; if (config.baseDelay !== undefined) retryState.baseDelay = config.baseDelay; if (config.maxDelay !== undefined) retryState.maxDelay = config.maxDelay; if (config.backoffMultiplier !== undefined) retryState.backoffMultiplier = config.backoffMultiplier; }
export function getRetryStats() { return { pendingRetries: retryState.attempts.size, maxRetries: retryState.maxRetries, baseDelay: retryState.baseDelay, maxDelay: retryState.maxDelay, metrics: { ..._metrics } }; }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics, pendingRetries: retryState.attempts.size }; }
export function resetMetrics() { _metrics.retryCount = 0; _metrics.successCount = 0; _metrics.failCount = 0; _metrics.lastRetryAt = null; }
export function getLogs() { return [..._logBuffer]; }
export function healthCheck() { const checks = { noPendingOverflow: retryState.attempts.size < 100, configValid: retryState.maxRetries > 0 && retryState.baseDelay > 0 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, issues: passed < 2 ? ['Retry queue overflow or invalid config'] : null, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, ...getRetryStats(), healthCheck: healthCheck(), timestamp: new Date().toISOString() }; }
export default { calculateDelay, shouldRetry, incrementAttempt, clearAttempts, cleanupOldAttempts, configureRetry, getRetryStats, getVersion, setDebug, getMetrics, resetMetrics, getLogs, healthCheck, info };
