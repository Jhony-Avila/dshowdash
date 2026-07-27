// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.telemetry.tracker
// PURPOSE: Ticker Telemetry Tracker (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   setDebug() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '6.3.0-P17WI';
export const MODULE_ID = 'ticker.telemetry.tracker';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
let _debug = false;
function _log(level: string, ...args: unknown[]) { const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; } if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; } if (_debug) logger.debug?.(`[${MODULE_ID}]`, ...args); }
export class TelemetryTracker {
  [key: string]: any;
  constructor(options: { rateLimit?: number; dedupeWindowMs?: number } = {}) { this._debug = false; this._enabled = true; this._rateLimit = options.rateLimit || 10; this._dedupeWindowMs = options.dedupeWindowMs || 1000; this._recentHashes = new Map(); this._eventCounts = new Map(); this._lastReset = Date.now(); this._metrics = { trackCount: 0, droppedByRate: 0, droppedByDedupe: 0, lastTrackAt: null }; }
  _hash(event: string, data: unknown) { const str = event + JSON.stringify(data || {}); let hash = 0; for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; } return hash.toString(36); }
  _checkRateLimit(event: string) { const now = Date.now(); if (now - this._lastReset > 1000) { this._eventCounts.clear(); this._lastReset = now; } const count = this._eventCounts.get(event) || 0; if (count >= this._rateLimit) { this._metrics.droppedByRate++; return false; } this._eventCounts.set(event, count + 1); return true; }
  _checkDedupe(hash: string) { const now = Date.now(); const lastSeen = this._recentHashes.get(hash); if (lastSeen && (now - lastSeen) < this._dedupeWindowMs) { this._metrics.droppedByDedupe++; return false; } this._recentHashes.set(hash, now); if (this._recentHashes.size > 100) { const cutoff = now - this._dedupeWindowMs; for (const [k, v] of this._recentHashes) { if (v < cutoff) this._recentHashes.delete(k); } } return true; }
  track(event: string, data: unknown = null) { if (!this._enabled) return false; if (!this._checkRateLimit(event)) { _log('debug', `Rate limited: ${event}`); return false; } const hash = this._hash(event, data); if (!this._checkDedupe(hash)) { _log('debug', `Dedupe: ${event}`); return false; } const cfg = _getPort('config'); const logger = _getPort('logger'); if (cfg?.app?.debug && logger) { logger.debug?.('[Ticker:Telemetry]', event, data); } this._metrics.trackCount++; this._metrics.lastTrackAt = Date.now(); return true; }
  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  isEnabled() { return this._enabled; }
  setRateLimit(limit: number) { this._rateLimit = limit; }
  setDedupeWindow(ms: number) { this._dedupeWindowMs = ms; }
  healthCheck() { const checks = { enabled: this._enabled, hasRateLimit: this._rateLimit > 0, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, enabled: this._enabled, rateLimit: this._rateLimit, dedupeWindowMs: this._dedupeWindowMs, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; }
  setDebug(enabled: unknown) { this._debug = !!enabled; _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { trackCount: 0, droppedByRate: 0, droppedByDedupe: 0, lastTrackAt: null }; }
}
export function getVersion() { return VERSION; }
export function setDebug(enabled: unknown) { _debug = !!enabled; }
export default TelemetryTracker;
