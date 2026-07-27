// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/wechat-integration/telemetry/tracker
// PURPOSE: Telemetry event tracker with buffered event storage
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   TelemetryTracker — Class for tracking, flushing, and managing telemetry events
//   setDebug() — Toggle debug mode
//   getLogs() — Retrieve internal log buffer
// ═══════════════════════════════════════════════════════════════
// WeChat Integration - Telemetry Tracker (Enterprise)
// @version 5.1.0-ENTERPRISE
'use strict';
export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/wechat-integration/telemetry/tracker';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class TelemetryTracker { [key: string]: any;
  constructor(options: { enabled?: boolean; maxEvents?: number } = {}) { this.enabled = options.enabled !== false; this.events = []; this.maxEvents = options.maxEvents || 100; this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null }; }
  track(event: string, data: Record<string, unknown> = {}) { if (!this.enabled) return; this.events.push({ event, data, timestamp: Date.now() }); this._metrics.trackCount++; this._metrics.lastTrackAt = Date.now(); if (this.events.length > this.maxEvents) this.events.shift(); }
  getEvents() { return [...this.events]; }
  flush() { const evts = [...this.events]; this.events = []; this._metrics.flushCount++; return evts; }
  clear() { this.events = []; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  healthCheck() { const checks = { enabled: this.enabled, belowMax: this.events.length < this.maxEvents }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this.events.length, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default TelemetryTracker;
