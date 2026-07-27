// ===================================================================
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// ===================================================================
// MODULE: header/components/errors-status/api/alerts
// PURPOSE: Alerts API for fetching error alerts
// -------------------------------------------------------------------
// IMPORTS:
//   FetchAdapter from ./fetch.js
// PROVIDES:
//   AlertsAPI class - Fetch and manage error alerts
//   setDebug(enabled) - Toggle debug mode
//   getLogs() - Get log buffer
// ===================================================================
// Errors Status - Alerts API (Enterprise)
// @version 5.1.0-ENTERPRISE
'use strict';
export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/errors-status/api/alerts';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
import FetchAdapter from './fetch.js';
export class AlertsAPI {
  [key: string]: any;
  constructor(options = {}) { this.fetch = (new (FetchAdapter as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(options)); this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null }; }
  async getAlerts() {
    this._metrics.getCount++; this._metrics.lastGetAt = Date.now();
    try { const response = await this.fetch.get('/alerts/errors.php'); this._metrics.successCount++; return { ok: true, alerts: response.alerts || [] }; }
    catch (error: any) { this._metrics.errorCount++; return { ok: false, alerts: ([] as unknown[]), error: error.message }; }
  }
  healthCheck() { const checks = { fetchReady: !!this.fetch, goodSuccessRate: this._metrics.getCount === 0 || (this._metrics.successCount / this._metrics.getCount) > 0.5 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; if (this.fetch?.setDebug) this.fetch.setDebug(enabled); }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default AlertsAPI;
