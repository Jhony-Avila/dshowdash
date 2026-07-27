// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/instagram-messenger-integration/state/store
// PURPOSE: Reactive state store with subscriber notifications for Instagram data
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   StateStore — Class for state management with subscribe/setState/reset
//   setDebug() — Toggle debug mode
//   getLogs() — Retrieve internal log buffer
// ═══════════════════════════════════════════════════════════════
// Instagram Messenger Integration - State Store (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/instagram-messenger-integration/state/store';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class StateStore {
  [key: string]: any;
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.subscribers = [];
    this._debug = false;
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() { return { ...this.state }; }
  setState(updates: Record<string,unknown>) {
    const prevState = this.getState();
    this.state = { ...this.state, ...updates };
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    // @ts-expect-error TS migration - TS2349
    this.subscribers.forEach((sub: unknown) => { try { sub(this.state, prevState); this._metrics.notifyCount++; } catch (error) { _log('error', 'Store error:', error); } });
  }
  subscribe(subscriber: Record<string,unknown>) { this.subscribers.push(subscriber); return () => { const index = this.subscribers.indexOf(subscriber); if (index > -1) this.subscribers.splice(index, 1); }; }
  reset() { this.state = {}; this.subscribers = []; }
  healthCheck() {
    const checks = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
  }
  info() { return { version: VERSION, moduleId: MODULE_ID, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default StateStore;
