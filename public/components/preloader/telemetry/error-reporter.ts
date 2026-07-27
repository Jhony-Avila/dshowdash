// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: boot-error-reporter
// PURPOSE: Boot Error Reporter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   configure() — exported function
//   getConfig() — exported function
//   report() — exported function
//   reportBootError() — exported function
//   reportDegradedBoot() — exported function
//   reportTimeout() — exported function
//   flush() — exported function
//   getQueueSize() — exported function
//   getMetrics() — exported function
//   clearQueue() — exported function
//   clearSentHistory() — exported function
//   disable() — exported function
//   enable() — exported function
//   getStatus() — exported function
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
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.4.0-P17WI';
export const MODULE_ID = 'boot-error-reporter';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const log = { info(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, debug(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, warn(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, error(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };
const _config: Record<string, any> = { enabled: true, endpoint: null as string | null, apiKey: null as string | null, batchSize: 10, flushInterval: 30000, maxRetries: 3, retryDelay: 5000, includeUserAgent: true, includeScreenInfo: true, includePerformance: true, customHeaders: {}, beforeSend: null, onError: null, onSuccess: null };
const MAX_QUEUE_SIZE = 100;
const _errorQueue: Record<string, any>[] = [];
const _sentErrors = new Set();
let _flushTimer: ReturnType<typeof setInterval> | null = null;
const _metrics = { totalErrors: 0, sentErrors: 0, failedSends: 0, duplicatesSkipped: 0, lastSentAt: null as number | null };
export function configure(options?: Record<string, any>) { Object.assign(_config, options || {}); if (_config.enabled && _config.flushInterval > 0) _startAutoFlush(); log.info('Error reporter configured', { endpoint: _config.endpoint, enabled: _config.enabled }); }
export function getConfig() { return Object.assign({}, _config, { apiKey: _config.apiKey ? '***' : null }); }
export function report(error: unknown, context: Record<string, any> = {}) {

  // @ts-expect-error TS migration - TS2339
  if (!_config.enabled) return null;const errorReport = _createErrorReport(error, context);const fingerprint = _getFingerprint(errorReport);if (_sentErrors.has(fingerprint)) { _metrics.duplicatesSkipped++; log.debug('Duplicate error skipped', { fingerprint }); return null; }errorReport.fingerprint = fingerprint;if (_errorQueue.length >= MAX_QUEUE_SIZE) { _errorQueue.shift(); log.warn('Error queue overflow, oldest entry discarded', { queueSize: MAX_QUEUE_SIZE }); }_errorQueue.push(errorReport);_metrics.totalErrors++;log.info('Error queued for reporting', { type: errorReport.type, message: errorReport.message ? errorReport.message.substring(0, 100) : '', queueSize: _errorQueue.length });if (context.critical || _errorQueue.length >= _config.batchSize) flush();return errorReport;
}
export function reportBootError(bootData: Record<string, any>, error: unknown) { return report(error, { type: 'boot-error', bootId: bootData.bootId, phase: bootData.phase, progress: bootData.progress, duration: bootData.duration, trace: bootData.trace, critical: true }); }
export function reportDegradedBoot(bootData: Record<string, any>, reason: string) { return report(new Error(`Degraded boot: ${reason}`), { type: 'boot-degraded', bootId: bootData.bootId, phase: bootData.phase, progress: bootData.progress, duration: bootData.duration, reason }); }
export function reportTimeout(bootData: Record<string, any>, phase: string, timeoutMs: number) { return report(new Error(`Timeout in phase: ${phase}`), { type: 'boot-timeout', bootId: bootData.bootId, phase, timeoutMs, progress: bootData.progress }); }
function _createErrorReport(error: unknown, context: Record<string, any>) { let url = null; if (typeof location !== 'undefined') url = location.href; return { id: `err_${Date.now()}_${(Math.random().toString(36) as any).substr(2, 6)}`, timestamp: (new Date() as any).toISOString(), type: (context as any).type || 'error', message: error ? (error as any).message : String((error as any)), name: error ? (error as Error).name : 'Error', stack: error ? (error as Error).stack : null, bootId: context.bootId || null, phase: context.phase || null, progress: context.progress || null, duration: context.duration || null, environment: { url, userAgent: _config.includeUserAgent && typeof navigator !== 'undefined' ? navigator.userAgent : null, language: typeof navigator !== 'undefined' ? navigator.language : null, online: typeof navigator !== 'undefined' ? navigator.onLine : null, screen: _config.includeScreenInfo && typeof screen !== 'undefined' ? { width: screen.width, height: screen.height, colorDepth: screen.colorDepth } : null }, performance: _config.includePerformance ? _getPerformanceData() : null, metadata: context.metadata || {}, trace: context.trace || [] }; }

// @ts-expect-error TS migration - TS2339
function _getPerformanceData() { if (typeof performance === 'undefined') return null; const timing = performance.timing || {}; return { domReady: timing.domContentLoadedEventEnd - timing.navigationStart, loadComplete: timing.loadEventEnd - timing.navigationStart, memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : null }; }
function _getFingerprint(report: Record<string, any>) { const parts = [report.name, report.message ? report.message.substring(0, 100) : '', report.phase, report.stack ? report.stack.split('\n')[1] : ''].filter(Boolean); return _hashString(parts.join('|')); }
function _hashString(str: string) { let hash = 0; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; } return Math.abs(hash).toString(36); }

export function flush() { if (_errorQueue.length === 0) return Promise.resolve({ sent: 0 }); if (!_config.endpoint) { log.warn('No endpoint configured, errors not sent'); return Promise.resolve({ sent: 0, error: 'No endpoint' }); } const batch = _errorQueue.splice(0, _config.batchSize); return _sendBatch(batch).then(response => { batch.forEach(err => { _sentErrors.add(err.fingerprint); }); _metrics.sentErrors += batch.length; _metrics.lastSentAt = Date.now(); if (_config.onSuccess) _config.onSuccess(batch, response); log.info('Errors sent successfully', { count: batch.length }); return { sent: batch.length, response }; }).catch(error => { _metrics.failedSends++; const spaceLeft = MAX_QUEUE_SIZE - _errorQueue.length; if (spaceLeft > 0) _errorQueue.unshift(...batch.slice(0, spaceLeft)); if (_config.onError) _config.onError(error, batch); log.error('Failed to send errors', { error: error.message }); return { sent: 0, error: error.message }; }); }
function _sendBatch(batch: Record<string, any>[], retryCount = 0): Promise<Record<string, any>> {
  const headers: Record<string, string> = Object.assign({ 'Content-Type': 'application/json' }, _config.customHeaders);if (_config.apiKey) headers['Authorization'] = `Bearer ${_config.apiKey}`;const _ctrl = new AbortController();const _tout = setTimeout(() => _ctrl.abort(), 15000);return fetch(_config.endpoint, { method: 'POST', headers, body: JSON.stringify({ version: VERSION, sentAt: new Date().toISOString(), errors: batch }), signal: _ctrl.signal }).then(response => { clearTimeout(_tout); if (!response.ok) { if (retryCount < _config.maxRetries) { return new Promise(resolve => { setTimeout(resolve, _config.retryDelay); }).then(() => _sendBatch(batch, retryCount + 1)); } throw new Error(`HTTP ${response.status}: ${response.statusText}`); } return response.json().catch(() => ({
    ok: true
  })); });
}
function _startAutoFlush() { _stopAutoFlush(); _flushTimer = setInterval(() => { if (_errorQueue.length > 0) flush(); }, _config.flushInterval); }
function _stopAutoFlush() { if (_flushTimer) { clearInterval(_flushTimer); _flushTimer = null; } }
export function getQueueSize() { return _errorQueue.length; }
export function getMetrics() { return Object.assign({}, _metrics); }
export function clearQueue() { const count = _errorQueue.length; _errorQueue.length = 0; return count; }
export function clearSentHistory() { _sentErrors.clear(); }
export function disable() { _config.enabled = false; _stopAutoFlush(); }
export function enable() { _config.enabled = true; if (_config.flushInterval > 0) _startAutoFlush(); }
export function getStatus() { return { version: VERSION, moduleId: MODULE_ID, enabled: _config.enabled, endpoint: _config.endpoint ? '***configured***' : null, queueSize: _errorQueue.length, metrics: getMetrics() }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: _config.enabled ? 'HEALTHY' : 'DISABLED', moduleId: MODULE_ID, version: VERSION, checks: { enabled: _config.enabled, hasEndpoint: !!_config.endpoint, queueNotOverflowing: _errorQueue.length < 100, hasLogger: !!_getPort('logger'), portsInitialized: ps._initialized }, timestamp: Date.now() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, features: ['error-batching', 'deduplication', 'auto-flush', 'retries', 'hooks', 'performance-data'], status: getStatus() }; }
export default { VERSION, MODULE_ID, configure, getConfig, report, reportBootError, reportDegradedBoot, reportTimeout, flush, getQueueSize, getMetrics, clearQueue, clearSentHistory, disable, enable, getStatus, healthCheck, info };
