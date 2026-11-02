// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/state/store
// PURPOSE: Telemetry Core - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   generateSessionId, generateBootId from ../utils/uuid.js
//   getTimestampMs from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   initStore() — exported function
//   getSessionId() — exported function
//   getBootId() — exported function
//   isReady() — exported function
//   isEnabled() — exported function
//   isSending() — exported function
//   getConfig() — exported function
//   getContext() — exported function
//   getBuffer() — exported function
//   getBufferSize() — exported function
//   getStats() — exported function
//   setContext() — exported function
//   setSending() — exported function
//   setLastFlushAt() — exported function
//   setEnabled() — exported function
//   updateConfig() — exported function
//   addToBuffer() — exported function
//   clearBuffer() — exported function
//   removeFromBuffer() — exported function
//   resetStore() — exported function
//   getVersion() — exported function
//   setDebug() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   getLogs() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getStoreInfo() — exported function
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
import { generateSessionId, generateBootId } from '../utils/uuid.js';
import { getTimestampMs } from '../utils/helpers.js';
export const VERSION = '5.1.0-ENTERPRISE';
const MODULE_ID = 'telemetry-core/state/store';
let _debug = false; let _logBuffer: unknown[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level !== 'error') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
const state = { sessionId: null as unknown | null, bootId: null as unknown | null, isReady: false, isEnabled: true, isSending: false, lastFlushAt: 0, droppedEvents: 0, totalEvents: 0, context: {} as Record<string, unknown>, buffer: [] as Record<string, unknown>[], config: { maxBufferSize: 500, batchSize: 20, flushIntervalMs: 30000, endpoint: '/api/telemetry/', enabled: true, debug: false, sampleRates: { debug: 0.1, info: 0.5, warn: 1.0, error: 1.0, critical: 1.0 } } };
const _metrics = { initCount: 0, resetCount: 0, addToBufferCount: 0, clearBufferCount: 0 };
export function initStore(config = {}) { _metrics.initCount++; state.sessionId = generateSessionId(); state.bootId = generateBootId(); state.isReady = true; state.lastFlushAt = getTimestampMs(); state.droppedEvents = 0; state.totalEvents = 0; state.buffer = []; if (config) Object.assign(state.config, config); state.isEnabled = state.config.enabled !== false; _log('info', 'Store initialized'); }
export function getSessionId() { return state.sessionId; }
export function getBootId() { return state.bootId; }
export function isReady() { return state.isReady; }
export function isEnabled() { return state.isEnabled; }
export function isSending() { return state.isSending; }
export function getConfig() { return { ...state.config }; }
export function getContext() { return { ...state.context }; }
export function getBuffer() { return state.buffer; }
export function getBufferSize() { return state.buffer.length; }
export function getStats() { return { sessionId: state.sessionId, bootId: state.bootId, isReady: state.isReady, isEnabled: state.isEnabled, isSending: state.isSending, bufferSize: state.buffer.length, maxBufferSize: state.config.maxBufferSize, droppedEvents: state.droppedEvents, totalEvents: state.totalEvents, lastFlushAt: state.lastFlushAt }; }
export function setContext(contextPatch: Record<string, unknown>) { state.context = { ...state.context, ...contextPatch }; }
export function setSending(value: unknown) { state.isSending = Boolean(value); }
export function setLastFlushAt(timestamp: number) { state.lastFlushAt = timestamp; }
export function setEnabled(value: unknown) { state.isEnabled = Boolean(value); }
export function updateConfig(configPatch: Record<string, unknown>) { Object.assign(state.config, configPatch); if (configPatch.enabled !== undefined) state.isEnabled = Boolean(configPatch.enabled); }
export function addToBuffer(event: Record<string, unknown>) { _metrics.addToBufferCount++; state.totalEvents++; if (state.buffer.length >= state.config.maxBufferSize) { state.buffer.shift(); state.droppedEvents++; } state.buffer.push(event); }
export function clearBuffer() { _metrics.clearBufferCount++; const events = [...state.buffer]; state.buffer = []; return events; }
export function removeFromBuffer(count: number) { return state.buffer.splice(0, count); }
export function resetStore() { _metrics.resetCount++; state.sessionId = null; state.bootId = null; state.isReady = false; state.isSending = false; state.lastFlushAt = 0; state.droppedEvents = 0; state.totalEvents = 0; state.context = {}; state.buffer = []; }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; state.config.debug = !!enabled; }
export function getMetrics() { return { ..._metrics, ...getStats() }; }
export function resetMetrics() { _metrics.initCount = 0; _metrics.resetCount = 0; _metrics.addToBufferCount = 0; _metrics.clearBufferCount = 0; }
export function getLogs() { return [..._logBuffer]; }
export function healthCheck() { const checks = { isReady: state.isReady, isEnabled: state.isEnabled, bufferNotFull: state.buffer.length < state.config.maxBufferSize, hasSessionId: !!state.sessionId }; const passed = Object.values(checks).filter(Boolean).length; const issues = []; if (!state.isReady) issues.push('Store not ready'); if (!state.isEnabled) issues.push('Telemetry disabled'); if (state.buffer.length >= state.config.maxBufferSize) issues.push('Buffer full'); return { status: passed === 4 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'CRITICAL', score: passed, maxScore: 4, scoreDisplay: `${passed}/4`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, ...getStats(), metrics: { ..._metrics }, healthCheck: healthCheck(), timestamp: new Date().toISOString() }; }
export function getStoreInfo() { return info(); }
export default { initStore, resetStore, getSessionId, getBootId, isReady, isEnabled, getConfig, getContext, getBuffer, getStats, setContext, updateConfig, addToBuffer, clearBuffer, getVersion, setDebug, getMetrics, resetMetrics, getLogs, healthCheck, info };
