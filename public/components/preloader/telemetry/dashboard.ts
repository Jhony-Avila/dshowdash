// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: boot-telemetry-dashboard
// PURPOSE: Boot Telemetry Dashboard
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   recordBoot() — exported function
//   getMetrics() — exported function
//   getHistory() — exported function
//   getBootById() — exported function
//   getLastBoot() — exported function
//   getFailedBoots() — exported function
//   getDegradedBoots() — exported function
//   getSlowBoots() — exported function
//   getPhaseStats() — exported function
//   analyzePerformance() — exported function
//   exportData() — exported function
//   clearHistory() — exported function
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
export const VERSION = '1.3.0-P17WI';
export const MODULE_ID = 'boot-telemetry-dashboard';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const log = { info(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, debug(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };
const _bootHistory: Record<string, any>[] = [];
const _MAX_HISTORY = 100;
const _metrics: Record<string, any> = { totalBoots: 0, successfulBoots: 0, failedBoots: 0, degradedBoots: 0, totalDuration: 0, minDuration: Infinity, maxDuration: 0, avgDuration: 0, p50Duration: 0, p90Duration: 0, p99Duration: 0, lastBootAt: null, phases: {} as Record<string, any> };
export function recordBoot(bootData: Record<string, any>) { const record = { bootId: bootData.bootId || (`boot_${Date.now()}`), startTime: bootData.startTime || Date.now(), endTime: bootData.endTime || Date.now(), duration: bootData.duration || (bootData.endTime - bootData.startTime), result: bootData.result || 'success', exitCode: bootData.exitCode || 'boot:complete', phases: bootData.phases || {}, trace: bootData.trace || [], errors: bootData.errors || [], metadata: bootData.metadata || {}, recordedAt: Date.now() }; _bootHistory.push(record); if (_bootHistory.length > _MAX_HISTORY) _bootHistory.shift(); _updateMetrics(record); log.info('Boot recorded', { bootId: record.bootId, duration: record.duration, result: record.result }); return record; }
function _updateMetrics(record: Record<string, any>) { _metrics.totalBoots++; _metrics.lastBootAt = record.recordedAt; _metrics.totalDuration += record.duration; if (record.result === 'success') _metrics.successfulBoots++; else if (record.result === 'failed') _metrics.failedBoots++; else if (record.result === 'degraded') _metrics.degradedBoots++; if (record.duration < _metrics.minDuration) _metrics.minDuration = record.duration; if (record.duration > _metrics.maxDuration) _metrics.maxDuration = record.duration; _metrics.avgDuration = _metrics.totalDuration / _metrics.totalBoots; const durations = _bootHistory.map(b => b.duration).sort((a, b) => a - b); _metrics.p50Duration = _percentile(durations, 50); _metrics.p90Duration = _percentile(durations, 90); _metrics.p99Duration = _percentile(durations, 99); if (record.phases) { for (const phase in record.phases) { if (record.phases.hasOwnProperty(phase)) { const data = record.phases[phase]; if (!_metrics.phases[phase]) _metrics.phases[phase] = { count: 0, totalDuration: 0, avgDuration: 0, errors: 0 }; _metrics.phases[phase].count++; _metrics.phases[phase].totalDuration += data.duration || 0; _metrics.phases[phase].avgDuration = _metrics.phases[phase].totalDuration / _metrics.phases[phase].count; if (data.error) _metrics.phases[phase].errors++; } } } }
function _percentile(arr: number[], p: number) { if (arr.length === 0) return 0; const index = Math.ceil((p / 100) * arr.length) - 1; return arr[Math.max(0, index)]; }
export function getMetrics() { return Object.assign({}, _metrics, { successRate: _metrics.totalBoots > 0 ? `${((_metrics.successfulBoots / _metrics.totalBoots) * 100).toFixed(2)}%` : '0%', failureRate: _metrics.totalBoots > 0 ? `${((_metrics.failedBoots / _metrics.totalBoots) * 100).toFixed(2)}%` : '0%' }); }
export function getHistory(limit?: number) { return _bootHistory.slice(-(limit || 10)); }
export function getBootById(bootId: string) { for (let i = 0; i < _bootHistory.length; i++) { if (_bootHistory[i].bootId === bootId) return _bootHistory[i]; } return null; }
export function getLastBoot() { return _bootHistory.length > 0 ? _bootHistory[_bootHistory.length - 1] : null; }
export function getFailedBoots(limit?: number) { return _bootHistory.filter(b => b.result === 'failed').slice(-(limit || 10)); }
export function getDegradedBoots(limit?: number) { return _bootHistory.filter(b => b.result === 'degraded').slice(-(limit || 10)); }
export function getSlowBoots(thresholdMs?: number, limit?: number) { const t = thresholdMs || 5000; return _bootHistory.filter(b => b.duration > t).slice(-(limit || 10)); }
export function getPhaseStats(phaseName: string) { return _metrics.phases[phaseName] || null; }
export function analyzePerformance() { const analysis: Record<string, any> = { overall: { status: 'healthy', issues: [] as string[], recommendations: [] as string[] }, phases: {} as Record<string, Record<string, unknown>>, trends: {} }; if (_metrics.avgDuration > 5000) { analysis.overall.status = 'warning'; analysis.overall.issues.push('High average boot time'); analysis.overall.recommendations.push('Consider lazy loading non-critical components'); } if (_metrics.failedBoots / _metrics.totalBoots > 0.05) { analysis.overall.status = 'critical'; analysis.overall.issues.push('High failure rate (>5%)'); } if (_metrics.degradedBoots / _metrics.totalBoots > 0.1) { if (analysis.overall.status !== 'critical') analysis.overall.status = 'warning'; analysis.overall.issues.push('High degraded boot rate (>10%)'); } for (const phase in _metrics.phases) { if (_metrics.phases.hasOwnProperty(phase)) { const stats = _metrics.phases[phase]; analysis.phases[phase] = { avgDuration: stats.avgDuration, errorRate: stats.count > 0 ? `${((stats.errors / stats.count) * 100).toFixed(2)}%` : '0%', status: stats.errors / stats.count > 0.1 ? 'warning' : 'healthy' }; } } return analysis; }
export function exportData() { return { version: VERSION, exportedAt: new Date().toISOString(), metrics: getMetrics(), history: _bootHistory, analysis: analyzePerformance() }; }

export function clearHistory() { _bootHistory.length = 0; Object.assign(_metrics, { totalBoots: 0, successfulBoots: 0, failedBoots: 0, degradedBoots: 0, totalDuration: 0, minDuration: Infinity, maxDuration: 0, avgDuration: 0, p50Duration: 0, p90Duration: 0, p99Duration: 0, lastBootAt: null, phases: {} }); log.info('History cleared'); }
export function getStatus() { return { version: VERSION, moduleId: MODULE_ID, historySize: _bootHistory.length, metrics: getMetrics() }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, hasLogger: !!_getPort('logger'), portsInitialized: ps._initialized, checks: { metricsTracking: true, historyEnabled: true }, timestamp: Date.now() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, features: ['boot-recording', 'percentiles', 'phase-analysis', 'trend-analysis', 'export'], status: getStatus() }; }
export default { VERSION, MODULE_ID, recordBoot, getMetrics, getHistory, getBootById, getLastBoot, getFailedBoots, getDegradedBoots, getSlowBoots, getPhaseStats, analyzePerformance, exportData, clearHistory, getStatus, healthCheck, info };
