// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer/components/status-lang/core/polling
// PURPOSE: Status Lang - Polling Coordinator (Enterprise)
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
//   PollingCoordinator — exported class
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
export const MODULE_ID = 'footer/components/status-lang/core/polling';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class PollingCoordinator {
  [key: string]: any;
  constructor(options: { interval?: number } = {}) { this.interval = options.interval || 30000; this.timerId = null; this.callbacks = []; this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null }; }
  start() { if (this.timerId) return; this.timerId = setInterval(() => this._execute(), this.interval); }
  stop() { if (this.timerId) clearInterval(this.timerId); this.timerId = null; }
  async _execute() { if (document.hidden) return; this._metrics.pollCount++; this._metrics.lastPollAt = Date.now(); for (const cb of this.callbacks) { try { await cb(); this._metrics.successCount++; } catch (e) { this._metrics.errorCount++; _log('error', 'Poll error:', e); } } }
  onPoll(cb: Function) { this.callbacks.push(cb); }
  offPoll(cb: Function) { const i = this.callbacks.indexOf(cb); if (i > -1) this.callbacks.splice(i, 1); }
  healthCheck() { const checks = { isRunning: !!this.timerId, hasCallbacks: this.callbacks.length > 0 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : passed === 1 ? 'DEGRADED' : 'STOPPED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, isRunning: !!this.timerId, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default PollingCoordinator;
