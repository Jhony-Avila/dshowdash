// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer/components/status-lang/state/store
// PURPOSE: Status Lang - State Store (Enterprise)
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
//   StateStore — exported class
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
export const MODULE_ID = 'footer/components/status-lang/state/store';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class StateStore {
  [key: string]: any;
  constructor(initialState = {}) { this.state = { ...initialState }; this.subscribers = []; this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null }; }
  getState() { return { ...this.state }; }
  // @ts-expect-error TS migration - TS2349
  setState(updates: Record<string,unknown>) { const prev = this.getState(); this.state = { ...this.state, ...updates }; this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this.subscribers.forEach((s: unknown) => { try { s(this.state, prev); this._metrics.notifyCount++; } catch (e) { _log('error', 'Subscriber error:', e); } }); }
  subscribe(s: unknown) { this.subscribers.push(s); return () => { const i = this.subscribers.indexOf(s); if (i > -1) this.subscribers.splice(i, 1); }; }
  healthCheck() { const checks = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default StateStore;
