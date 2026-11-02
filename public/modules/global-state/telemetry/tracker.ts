// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-telemetry
// PURPOSE: Global State Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//
// PROVIDES:
//   default export
//   MODULE_ID
//   VERSION
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import { STATE_EVENTS } from '/core/runtime/events/catalog/state.events.js';

const MODULE_ID = 'global-state-telemetry';
const VERSION = '4.3.0-ENTERPRISE';

function _buildTimestamp() {
  if (typeof window !== 'undefined' && (window as any).Telemetry && (window as any).Telemetry.buildTimestamp) return (window as any).Telemetry.buildTimestamp();
  const now = Date.now();
  return { timestampUtc: now, isoUtc: new Date(now).toISOString(), localTime: new Date(now).toLocaleString('pt-BR'), timeZone: 'America/Sao_Paulo', locale: 'pt-BR' };
}

const _metrics: { trackedEvents: number; stateChanges: number; errors: number; performanceEntries: number; emitsToGlobal: number; lastEventAt: number | null; lastEventLocalTime: string | null } = { trackedEvents: 0, stateChanges: 0, errors: 0, performanceEntries: 0, emitsToGlobal: 0, lastEventAt: null, lastEventLocalTime: null };

const GlobalStateTelemetry: {
  MODULE_ID: string;
  VERSION: string;
  enabled: boolean;
  history: unknown[];
  maxHistory: number;
  _sessionId: string | null;
  [key: string]: unknown;
} = {
  MODULE_ID,
  VERSION,
  enabled: true,
  history: [],
  maxHistory: 100,
  _sessionId: null,

  init(options: { enabled?: boolean; maxHistory?: number } = {}) {
    this.enabled = options.enabled !== false;
    this.maxHistory = options.maxHistory || 100;
    this.history = [];
    this._sessionId = null;
    // @ts-expect-error strict migration — TS2571
    this.track(TELEMETRY_EVENTS.INITIALIZED, { maxHistory: this.maxHistory });
  },

  track(event: string, data: unknown) {
    if (!this.enabled) return;
    data = data || {};
    const ts = _buildTimestamp();
    _metrics.trackedEvents++;
    _metrics.lastEventAt = ts.timestampUtc;
    _metrics.lastEventLocalTime = ts.localTime;
    // @ts-expect-error strict migration — TS2571
    const entry = { timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone, isoUtc: ts.isoUtc, event, data, sessionId: this.getSessionId() };
    this.history.push(entry);
    if (this.history.length > this.maxHistory) this.history.shift();
    // @ts-expect-error strict migration — TS2571
    this.emitToGlobal(entry);
  },

  trackStateChange(action: unknown, prevState: unknown, nextState: unknown) {
    _metrics.stateChanges++;
    const a: any = action;
    // @ts-expect-error strict migration — TS2571
    this.track(STATE_EVENTS.CHANGED, { action: a.type, payload: a.payload, changes: this.diffStates(prevState, nextState) });
  },

  trackError(error: unknown, context: unknown = {}) {
    _metrics.errors++;
    const e: any = error;
    // @ts-expect-error strict migration — TS2571
    this.track(STATE_EVENTS.ERROR, { message: e.message || String(error), stack: e.stack, context });
  },

  trackPerformance(operation: string, duration: number) {
    _metrics.performanceEntries++;
    const ts = _buildTimestamp();
    // @ts-expect-error strict migration — TS2571
    this.track(STATE_EVENTS.PERFORMANCE, { operation, duration, timestampUtc: ts.timestampUtc, localTime: ts.localTime });
  },

  diffStates(prev: unknown, next: unknown) {
    const changes: string[] = [];
    const seen: Record<string, boolean> = {};
    const prevKeys = prev ? Object.keys(prev as object) : [];
    const nextKeys = next ? Object.keys(next as object) : [];
    for (let i = 0; i < prevKeys.length; i++) { seen[prevKeys[i]] = true; }
    for (let j = 0; j < nextKeys.length; j++) { seen[(nextKeys as string[])[j]] = true; }
    const allKeys = Object.keys(seen);
    for (let k = 0; k < allKeys.length; k++) {
      const key = allKeys[k];
      const prevVal = prev ? (prev as Record<string, unknown>)[key] : undefined;
      const nextVal = next ? (next as Record<string, unknown>)[key] : undefined;
      if (prevVal !== nextVal) changes.push(key);
    }
    return changes;
  },

  getSessionId() {
    if (!this._sessionId) { this._sessionId = `gstate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
    return this._sessionId;
  },

  emitToGlobal(entry: Record<string, unknown>) {
    try {
      const TC = typeof window !== 'undefined' && (window.TelemetryCore || window.Telemetry);
      if (TC && typeof TC.track === 'function') {
        TC.track(`global-state:${entry.event}`, Object.assign({ timestampUtc: entry.timestampUtc, localTime: entry.localTime }, entry.data));
        _metrics.emitsToGlobal++;
      }
    } catch (e) {}
  },

  getHistory() { return this.history.slice(); },
  getEventLog() { return this.history.slice(); },
  getRecentEvents(count = 10) {
    const safeCount = Math.min(Math.max(1, count), this.history.length);return this.history.slice(-safeCount);
  },

  // @ts-expect-error strict migration — TS2571
  clearHistory() { const previousCount = this.history.length; this.history = []; this.track(TELEMETRY_EVENTS.CLEARED, { previousCount }); },
  clearEventLog() { this.history = []; return true; },

  // @ts-expect-error strict migration — TS2571
  export() { const ts = _buildTimestamp(); return { sessionId: this.getSessionId(), totalEvents: this.history.length, history: this.getHistory(), metrics: Object.assign({}, _metrics), exportedAt: ts.isoUtc, exportedAtLocal: ts.localTime }; },

  // @ts-expect-error strict migration — TS2571, TS2339
  getTrackerStats() { return { totalEvents: this.history.length, maxSize: this.maxHistory, enabled: this.enabled, sessionId: this.getSessionId(), oldestEvent: this.history[0] ? this.history[0].localTime : null, newestEvent: this.history[this.history.length - 1] ? this.history[this.history.length - 1].localTime : null, metrics: Object.assign({}, _metrics) }; },

  // @ts-expect-error strict migration — TS2571
  disable() { this.enabled = false; this.track(TELEMETRY_EVENTS.DISABLED, {}); },
  // @ts-expect-error strict migration — TS2571
  enable() { this.enabled = true; this.track(TELEMETRY_EVENTS.ENABLED, {}); },
  destroy() { this.history = []; this.enabled = false; this._sessionId = null; },

  // @ts-expect-error strict migration — TS2571
  info() { const ts = _buildTimestamp(); return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, historySize: this.history.length, maxHistory: this.maxHistory, sessionId: this.getSessionId(), metrics: Object.assign({}, _metrics), timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone }; },

  healthCheck() {
    const ts = _buildTimestamp();
    const buildTimestampAvailable = typeof window !== 'undefined' && window.Telemetry && typeof window.Telemetry.buildTimestamp === 'function';
    const checks = { enabled: this.enabled, historyNotOverflowing: this.history.length <= this.maxHistory, hasSessionId: !!this._sessionId || this.history.length === 0, lowErrorRate: _metrics.trackedEvents === 0 || (_metrics.errors / _metrics.trackedEvents) < 0.1, buildTimestampAvailable };
    let passed = 0; let total = 0; const keys = Object.keys(checks); for (let i = 0; i < keys.length; i++) { total++; if ((checks as Record<string, boolean>)[keys[i]]) passed++; }
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, healthy: passed === total, checks, metrics: Object.assign({}, _metrics), moduleId: MODULE_ID, version: VERSION, timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone };
  },

  resetMetrics() { _metrics.trackedEvents = 0; _metrics.stateChanges = 0; _metrics.errors = 0; _metrics.performanceEntries = 0; _metrics.emitsToGlobal = 0; _metrics.lastEventAt = null; _metrics.lastEventLocalTime = null; }
};

export default GlobalStateTelemetry;
export { MODULE_ID, VERSION };
