// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer/components/status-mode/api/alerts
// PURPOSE: Status Mode - Alerts API (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FetchAdapter from ./fetch.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
//   AlertsAPI — exported class
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
import FetchAdapter from './fetch.js';
export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'footer/components/status-mode/api/alerts';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class AlertsAPI {
  [key: string]: any;

  // @ts-expect-error TS migration - TS2351
  constructor(options: { baseURL?: string } = {}) { this.fetch = new FetchAdapter({ baseURL: options.baseURL || '/api' }); this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null }; }
  async getAlerts() { this._metrics.getCount++; this._metrics.lastGetAt = Date.now(); try { const response = await this.fetch.get('/alerts/list.php'); this._metrics.successCount++; return { ok: true, alerts: response.alerts || [] }; } catch (error) { this._metrics.errorCount++; return { ok: false, alerts: [] }; } }
  healthCheck() { const checks = { fetchReady: !!this.fetch, goodSuccessRate: this._metrics.getCount === 0 || (this._metrics.successCount / this._metrics.getCount) > 0.5 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; if (this.fetch?.setDebug) this.fetch.setDebug(enabled); }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default AlertsAPI;
