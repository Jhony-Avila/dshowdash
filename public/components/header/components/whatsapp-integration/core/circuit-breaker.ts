// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/whatsapp-integration/core/circuit-breaker
// PURPOSE: WhatsApp Integration - Circuit Breaker (Enterprise)
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
export const MODULE_ID = 'header/components/whatsapp-integration/core/circuit-breaker';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class CircuitBreaker {
  [key: string]: any;
  constructor(options: { failureThreshold?: number; timeout?: number; resetTimeout?: number } = {}) { this.failureThreshold = options.failureThreshold || 5; this.timeout = options.timeout || 60000; this.resetTimeout = options.resetTimeout || 30000; this.state = 'CLOSED'; this.failures = 0; this.nextAttempt = Date.now(); this._metrics = { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rejectedCalls: 0, lastCallAt: null }; }
  // @ts-expect-error TS migration - TS2349
  async execute(fn: Function, fallback: unknown) { this._metrics.totalCalls++; this._metrics.lastCallAt = Date.now(); if (this.state === 'OPEN') { if (Date.now() < this.nextAttempt) { this._metrics.rejectedCalls++; if (fallback) return fallback(); throw new Error('Circuit breaker is OPEN'); } this.state = 'HALF_OPEN'; } try { const result = await this._executeWithTimeout(fn); this._onSuccess(); return result; } catch (error) { this._onFailure(); if (fallback) return fallback(); throw error; } }
  async _executeWithTimeout(fn: Function) { return new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Operation timeout')), this.timeout); Promise.resolve(fn()).then(result => { clearTimeout(timer); resolve(result); }).catch(error => { clearTimeout(timer); reject(error); }); }); }
  _onSuccess() { this.failures = 0; this._metrics.successfulCalls++; if (this.state === 'HALF_OPEN') this.state = 'CLOSED'; }
  _onFailure() { this.failures++; this._metrics.failedCalls++; if (this.failures >= this.failureThreshold) { this.state = 'OPEN'; this.nextAttempt = Date.now() + this.resetTimeout; } }
  reset() { this.state = 'CLOSED'; this.failures = 0; this.nextAttempt = Date.now(); }
  getState() { return this.state; }
  healthCheck() { const checks = { isClosed: this.state === 'CLOSED', belowThreshold: this.failures < this.failureThreshold }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, state: this.state, failures: this.failures, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rejectedCalls: 0, lastCallAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
  destroy() { this.reset(); }
}
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default CircuitBreaker;
