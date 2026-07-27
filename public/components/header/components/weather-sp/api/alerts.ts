// =============================================================
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// =============================================================
// MODULE: header/components/weather-sp/api/alerts
// PURPOSE: Weather alerts API with heat/cold threshold detection
// -------------------------------------------------------------
// IMPORTS:
//   WeatherAPI from ./fetch.js
// PROVIDES:
//   AlertsAPI (class)
//   setDebug(enabled)
//   getLogs()
// =============================================================
// Weather SP - Alerts API (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/weather-sp/api/alerts';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

import WeatherAPI from './fetch.js';

export class AlertsAPI {
  [key: string]: any;
  constructor(options = {}) {
    this.api = (new (WeatherAPI as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(options));
    this._debug = false;
    this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null };
  }
  async getAlerts() {
    this._metrics.getCount++;
    this._metrics.lastGetAt = Date.now();
    try { const data = await this.api.fetchWeather(); this._metrics.successCount++; const alerts = []; if (data.temperature >= 35) alerts.push({ type: 'heat', message: 'Alerta de calor' }); if (data.temperature <= 10) alerts.push({ type: 'cold', message: 'Alerta de frio' }); return { ok: true, alerts }; }
    catch (error) { this._metrics.errorCount++; return { ok: false, alerts: [] }; }
  }
  healthCheck() {
    const checks = { apiReady: !!this.api, goodSuccessRate: this._metrics.getCount === 0 || (this._metrics.successCount / this._metrics.getCount) > 0.5 };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
  }
  info() { return { version: VERSION, moduleId: MODULE_ID, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; _debug = !!enabled; if (this.api?.setDebug) this.api.setDebug(enabled); }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { getCount: 0, successCount: 0, errorCount: 0, lastGetAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default AlertsAPI;
