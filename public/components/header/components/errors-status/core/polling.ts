// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/errors-status/core/polling
// PURPOSE: Errors Status - Polling Coordinator (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   setDebug() — exported function
//   getLogs() — exported function
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
export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/errors-status/core/polling';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class PollingCoordinator {
  [key: string]: any;
  constructor(options: { interval?: number; immediate?: boolean } = {}) { this.interval = options.interval || 30000; this.immediate = options.immediate !== false; this.timerId = null; this.isRunning = false; this.callbacks = []; this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null }; }
  start() { if (this.isRunning) return; this.isRunning = true; if (this.immediate) this._execute(); this.timerId = setInterval(() => this._execute(), this.interval); }
  stop() { if (!this.isRunning) return; this.isRunning = false; if (this.timerId) { clearInterval(this.timerId); this.timerId = null; } }
  async _execute() { if (document.hidden) return; if (this.callbacks.length === 0) return; this._metrics.pollCount++; this._metrics.lastPollAt = Date.now(); try { for (const callback of this.callbacks) { await callback(); } this._metrics.successCount++; } catch (error) { this._metrics.errorCount++; _log('error', 'Execution error:', error); } }
  onPoll(callback: Function) { this.callbacks.push(callback); }
  offPoll(callback: Function) { const index = this.callbacks.indexOf(callback); if (index > -1) this.callbacks.splice(index, 1); }
  healthCheck() { const checks = { isRunning: this.isRunning, hasCallbacks: this.callbacks.length > 0 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : passed === 1 ? 'DEGRADED' : 'STOPPED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, isRunning: this.isRunning, callbackCount: this.callbacks.length, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { pollCount: 0, successCount: 0, errorCount: 0, lastPollAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default PollingCoordinator;
