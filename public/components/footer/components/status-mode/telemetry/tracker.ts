// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer/components/status-mode/telemetry/tracker
// PURPOSE: Status Mode - Telemetry Tracker (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
//   TelemetryTracker — exported class
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
export const MODULE_ID = 'footer/components/status-mode/telemetry/tracker';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class TelemetryTracker {
  [key: string]: any;
  constructor(options: { maxEvents?: number; enabled?: boolean } = {}) { this.events = []; this.maxEvents = options.maxEvents || 100; this.enabled = options.enabled !== false; this._metrics = { trackCount: 0, flushCount: 0, lastTrackAt: null }; }
  track(event: string, data: Record<string, unknown> = {}) { if (!this.enabled) return; this.events.push({ event, data, timestamp: Date.now() }); this._metrics.trackCount++; this._metrics.lastTrackAt = Date.now(); if (this.events.length > this.maxEvents) this.events.shift(); }
  flush() { const evts = [...this.events]; this.events = []; this._metrics.flushCount++; return evts; }
  getEvents() { return [...this.events]; }
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
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default TelemetryTracker;
