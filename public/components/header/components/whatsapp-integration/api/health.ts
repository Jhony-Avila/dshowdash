// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/whatsapp-integration/api/health
// PURPOSE: WhatsApp Integration - Health API (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IntegrationAPI from ./fetch.js
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
export const MODULE_ID = 'header/components/whatsapp-integration/api/health';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

import IntegrationAPI from './fetch.js';

export class HealthAPI {
  [key: string]: any;
  constructor(options: { endpoint?: string } = {}) {
    this.api = (new (IntegrationAPI as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(options.endpoint));
    this._debug = false;
    this._metrics = { checkCount: 0, successCount: 0, errorCount: 0, lastCheckAt: null };
  }
  async checkHealth() {
    this._metrics.checkCount++;
    this._metrics.lastCheckAt = Date.now();
    try { await this.api.fetchStatus(); this._metrics.successCount++; return { ok: true, timestamp: Date.now() }; }
    catch (error: any) { this._metrics.errorCount++; return { ok: false, timestamp: Date.now(), error: error.message }; }
  }
  healthCheck() {
    const checks = { apiReady: !!this.api, goodSuccessRate: this._metrics.checkCount === 0 || (this._metrics.successCount / this._metrics.checkCount) > 0.5 };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
  }
  info() { return { version: VERSION, moduleId: MODULE_ID, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; _debug = !!enabled; if (this.api?.setDebug) this.api.setDebug(enabled); }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { checkCount: 0, successCount: 0, errorCount: 0, lastCheckAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default HealthAPI;
