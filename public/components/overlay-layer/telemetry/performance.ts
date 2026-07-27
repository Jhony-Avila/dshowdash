// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer.telemetry.performance
// PURPOSE: Overlay Layer - Performance Telemetry v2.4.0-P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   OVERLAY_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   startOpen() — exported function
//   markPhase() — exported function
//   endOpen() — exported function
//   startClose() — exported function
//   endClose() — exported function
//   getTiming() — exported function
//   getHistory() — exported function
//   clearHistory() — exported function
//   getStats() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   OVERLAY_EVENTS.PERFORMANCE
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { OVERLAY_EVENTS } from '/core/runtime/events/catalog/overlay.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

const VERSION = '2.4.0-P18EC';
const MODULE_ID = 'overlay-layer.telemetry.performance';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: DynObj) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _log = (level: DynObj, msg: string, data: DynObj) => { const logger = _getPort('logger'); if (!logger) return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.call(logger, `[${MODULE_ID}]`, msg, data || ''); };

const _timings = new Map();
let _history: DynObj[] = [];
const _config = { enabled: true, maxHistory: 100, slowThreshold: 200, criticalThreshold: 500, trackMemory: true };
const _metrics = { totalMeasurements: 0, avgOpenTime: 0, avgCloseTime: 0, slowOpens: 0, criticalOpens: 0 };


// @ts-expect-error TS migration - TS2339
function startOpen(overlayId, metadata) { if (!metadata) metadata = {}; if (!_config.enabled) return { ok: false, reason: 'disabled' }; const entry = { overlayId, type: metadata.type || 'unknown', startTime: performance.now(), startTimestamp: Date.now(), phases: { init: null, render: null, animate: null, interactive: null }, metadata }; if (_config.trackMemory && performance.memory) entry.memoryStart = performance.memory.usedJSHeapSize; _timings.set(overlayId, entry); return { ok: true, overlayId }; }
function markPhase(overlayId: string, phase: DynObj) { const entry = _timings.get(overlayId); if (!entry) return { ok: false, reason: 'not-found' }; entry.phases[phase] = performance.now() - entry.startTime; return { ok: true, phase, time: entry.phases[phase] }; }

// @ts-expect-error TS migration - TS2339
function endOpen(overlayId) { const entry = _timings.get(overlayId); if (!entry) return { ok: false, reason: 'not-found' }; const endTime = performance.now(); const totalTime = endTime - entry.startTime; entry.openTime = totalTime; entry.endTime = endTime; if (_config.trackMemory && performance.memory) { entry.memoryEnd = performance.memory.usedJSHeapSize; entry.memoryDelta = entry.memoryEnd - (entry.memoryStart || 0); } _metrics.totalMeasurements++; _metrics.avgOpenTime = (_metrics.avgOpenTime * (_metrics.totalMeasurements - 1) + totalTime) / _metrics.totalMeasurements; if (totalTime > _config.slowThreshold) _metrics.slowOpens++; if (totalTime > _config.criticalThreshold) { _metrics.criticalOpens++; _logSlowOpen(entry); } const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.PERFORMANCE, { type: 'open', overlayId, totalTime, phases: entry.phases, slow: totalTime > _config.slowThreshold }); return { ok: true, overlayId, totalTime, phases: entry.phases }; }
function startClose(overlayId: string) { const entry = _timings.get(overlayId); if (!entry) return { ok: false, reason: 'not-found' }; entry.closeStartTime = performance.now(); return { ok: true, overlayId }; }
function endClose(overlayId: string) { const entry = _timings.get(overlayId); if (!entry || !entry.closeStartTime) return { ok: false, reason: 'not-found' }; const closeTime = performance.now() - entry.closeStartTime; entry.closeTime = closeTime; entry.totalLifetime = entry.closeStartTime - entry.startTime + closeTime; const closeCount = _history.filter(h => h.closeTime).length + 1; _metrics.avgCloseTime = (_metrics.avgCloseTime * (closeCount - 1) + closeTime) / closeCount; _addToHistory(entry); _timings.delete(overlayId); return { ok: true, overlayId, closeTime, totalLifetime: entry.totalLifetime }; }

function _addToHistory(entry: DynObj) { _history.push({ overlayId: entry.overlayId, type: entry.type, openTime: entry.openTime, closeTime: entry.closeTime, totalLifetime: entry.totalLifetime, phases: Object.assign({}, entry.phases), memoryDelta: entry.memoryDelta, timestamp: entry.startTimestamp }); if (_history.length > _config.maxHistory) _history = _history.slice(-_config.maxHistory); }
function _logSlowOpen(entry: DynObj) { _log('warn', `Slow open detected: ${entry.overlayId} (${entry.openTime.toFixed(2)}ms)`, { type: entry.type, phases: entry.phases, threshold: _config.criticalThreshold }); }

function getTiming(overlayId: string) { return _timings.get(overlayId) || null; }
function getHistory(filter: DynObj) { if (!filter) filter = {}; let result = _history.slice(); if (filter.type) result = result.filter(h => h.type === filter.type); if (filter.slow) result = result.filter(h => h.openTime > _config.slowThreshold); if (filter.limit) result = result.slice(-filter.limit); return result; }
function clearHistory() { const count = _history.length; _history = []; return { ok: true, cleared: count }; }

function getStats() { if (_history.length === 0) return { ok: true, noData: true }; const openTimes = _history.map(h => h.openTime).filter(Boolean); const closeTimes = _history.map(h => h.closeTime).filter(Boolean); const percentile = (arr: DynObj, p: DynObj) => { const sorted = arr.slice().sort((a: DynObj, b: DynObj) => a - b); const idx = Math.ceil(sorted.length * p / 100) - 1; return sorted[Math.max(0, idx)]; }; const openStats = { avg: openTimes.reduce((a, b) => a + b, 0) / openTimes.length, min: Math.min.apply(null, openTimes), max: Math.max.apply(null, openTimes), p50: percentile(openTimes, 50), p90: percentile(openTimes, 90), p99: percentile(openTimes, 99) }; const closeStats = closeTimes.length > 0 ? { avg: closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length, min: Math.min.apply(null, closeTimes), max: Math.max.apply(null, closeTimes), p50: percentile(closeTimes, 50), p90: percentile(closeTimes, 90) } : null; return { ok: true, count: _history.length, open: openStats, close: closeStats, slowRate: _metrics.slowOpens / Math.max(1, _metrics.totalMeasurements), criticalRate: _metrics.criticalOpens / Math.max(1, _metrics.totalMeasurements) }; }

function getConfig() { return Object.assign({}, _config); }
function setConfig(newConfig: DynObj) { if (newConfig.enabled !== undefined) _config.enabled = newConfig.enabled; if (newConfig.maxHistory) _config.maxHistory = newConfig.maxHistory; if (newConfig.slowThreshold) _config.slowThreshold = newConfig.slowThreshold; if (newConfig.criticalThreshold) _config.criticalThreshold = newConfig.criticalThreshold; if (newConfig.trackMemory !== undefined) _config.trackMemory = newConfig.trackMemory; return { ok: true, config: Object.assign({}, _config) }; }
function getMetrics() { return Object.assign({}, _metrics, { activeTimings: _timings.size, historySize: _history.length }); }
function healthCheck() { const logger = _getPort('logger'); const eb = _getPort('eventBus'); const checks = { enabled: _config.enabled, lowSlowRate: _metrics.totalMeasurements === 0 || (_metrics.slowOpens / _metrics.totalMeasurements) < 0.2, historyNotOverflowing: _history.length < _config.maxHistory * 0.9, loggerAvailable: !!logger, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() }; let passed = 0; for (const k in checks) { if ((checks as DynObj)[k]) passed++; } return { status: passed === Object.keys(checks).length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${Object.keys(checks).length}`, checks, stats: getStats(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), config: getConfig(), metrics: getMetrics(), stats: getStats(), timestamp: Date.now() }; }

export { startOpen, markPhase, endOpen, startClose, endClose, getTiming, getHistory, clearHistory, getStats, getConfig, setConfig, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };

export default { startOpen, markPhase, endOpen, startClose, endClose, getTiming, getHistory, clearHistory, getStats, getConfig, setConfig, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
