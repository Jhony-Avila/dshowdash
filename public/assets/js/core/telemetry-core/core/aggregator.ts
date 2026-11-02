// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/core/aggregator
// PURPOSE: Telemetry Core - Event Aggregator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   addToBuffer, getBuffer, getBufferSize, removeFromBuffer, getConfig, getStats from ../state/store.js
//   applySamplingRules from ./sampler.js
//
// PROVIDES:
//   VERSION — module constant
//   aggregate() — exported function
//   getBatch() — exported function
//   shouldFlush() — exported function
//   getBufferSnapshot() — exported function
//   getAggregatorMetrics() — exported function
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
import { addToBuffer, getBuffer, getBufferSize, removeFromBuffer, getConfig, getStats } from '../state/store.js';
import { applySamplingRules } from './sampler.js';
export const VERSION = '5.1.0-ENTERPRISE';
const MODULE_ID = 'telemetry-core/core/aggregator';
let _debug = false; let _logBuffer: unknown[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level !== 'error') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
const _metrics = { aggregateCount: 0, droppedBySampling: 0, batchCount: 0 };
export function aggregate(event: Record<string, unknown>) { if (!event) return false; if (!applySamplingRules(event)) { _metrics.droppedBySampling++; return false; } _metrics.aggregateCount++; addToBuffer(event); return true; }
export function getBatch() { _metrics.batchCount++; const config = getConfig(); const batchSize = config.batchSize || 20; const bufferSize = getBufferSize(); if (bufferSize === 0) return []; return removeFromBuffer(Math.min(batchSize, bufferSize)); }
export function shouldFlush() { const config = getConfig(); const stats = getStats(); if (stats.bufferSize >= config.batchSize) return true; if (Date.now() - stats.lastFlushAt >= config.flushIntervalMs && stats.bufferSize > 0) return true; return false; }
export function getBufferSnapshot() { return [...getBuffer()]; }
export function getAggregatorMetrics() { const stats = getStats(); return { version: VERSION, moduleId: MODULE_ID, bufferSize: stats.bufferSize, maxBufferSize: stats.maxBufferSize, droppedEvents: stats.droppedEvents, totalEvents: stats.totalEvents, fillRate: (stats.bufferSize / stats.maxBufferSize * 100).toFixed(2) + '%', metrics: { ..._metrics } }; }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics, ...getAggregatorMetrics() }; }
export function resetMetrics() { _metrics.aggregateCount = 0; _metrics.droppedBySampling = 0; _metrics.batchCount = 0; }
export function getLogs() { return [..._logBuffer]; }
export function healthCheck() { const stats = getStats(); const checks = { bufferNotFull: stats.bufferSize < stats.maxBufferSize, lowDropRate: stats.droppedEvents < stats.totalEvents * 0.1 || stats.totalEvents === 0 }; const passed = Object.values(checks).filter(Boolean).length; const issues = []; if (stats.bufferSize >= stats.maxBufferSize) issues.push('Buffer full'); if (stats.droppedEvents >= stats.totalEvents * 0.1 && stats.totalEvents > 0) issues.push('High drop rate (>10%)'); return { status: passed === 2 ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'CRITICAL', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
// @ts-expect-error strict migration — TS2783
export function info() { return { version: VERSION, moduleId: MODULE_ID, ...getAggregatorMetrics(), healthCheck: healthCheck(), timestamp: new Date().toISOString() }; }
export default { aggregate, getBatch, shouldFlush, getBufferSnapshot, getAggregatorMetrics, getVersion, setDebug, getMetrics, resetMetrics, getLogs, healthCheck, info };
