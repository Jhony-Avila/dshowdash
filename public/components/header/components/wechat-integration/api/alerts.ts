// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/wechat-integration/api/alerts
// PURPOSE: Alerts API for monitoring unread WeChat message thresholds
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IntegrationAPI from ./fetch.js
// PROVIDES:
//   AlertsAPI — Class for fetching and evaluating alert conditions
//   setDebug() — Toggle debug mode
//   getLogs() — Retrieve internal log buffer
// ═══════════════════════════════════════════════════════════════
// WeChat Integration - Alerts API (Enterprise)
// @version 5.1.0-ENTERPRISE
'use strict';
export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/wechat-integration/api/alerts';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
import IntegrationAPI from './fetch.js';
export class AlertsAPI {
  [key: string]: any;
  constructor(options: { endpoint?: string; unreadThreshold?: number } = {}) { this.api = (new (IntegrationAPI as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(options.endpoint)); this.unreadThreshold = options.unreadThreshold || 10; this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null }; }
  async getAlerts() {
    this._metrics.getCount++; this._metrics.lastGetAt = Date.now();
    try { const data = await this.api.fetchStatus(); this._metrics.successCount++; const alerts = []; if (data.unread_count >= this.unreadThreshold) alerts.push({ type: 'high_unread', message: `${data.unread_count} mensagens WeChat não lidas` }); return { ok: true, alerts }; }
    catch (error: any) { this._metrics.errorCount++; return { ok: false, alerts: ([] as unknown[]), error: error.message }; }
  }
  healthCheck() { const checks = { apiReady: !!this.api, goodSuccessRate: this._metrics.getCount === 0 || (this._metrics.successCount / this._metrics.getCount) > 0.5 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, unreadThreshold: this.unreadThreshold, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; if (this.api?.setDebug) this.api.setDebug(enabled); }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default AlertsAPI;
