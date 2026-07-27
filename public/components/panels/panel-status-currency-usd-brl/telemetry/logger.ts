// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-currency-usd-brl/telemetry/logger
// PURPOSE: Panel Logger - Enterprise
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
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-status-currency-usd-brl/telemetry/logger';
let _debug = false; let _logBuffer: { level: string; args: unknown[]; ts: number }[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class Logger {
  [key: string]: any;
  constructor(options: { prefix?: string; level?: string; enabled?: boolean } = {}) { this.prefix = options.prefix || '[panel]'; this.level = options.level || 'info'; this.enabled = options.enabled !== false; this.levels = { debug: 0, info: 1, warn: 2, error: 3 }; this._metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0, lastLogAt: null }; }
  debug(...args: unknown[]) { this._logMsg('debug', ...args); }
  info(...args: unknown[]) { this._logMsg('info', ...args); }
  warn(...args: unknown[]) { this._logMsg('warn', ...args); }
  error(...args: unknown[]) { this._logMsg('error', ...args); }
  _logMsg(level: string, ...args: unknown[]) { if (!this.enabled || this.levels[level] < this.levels[this.level]) return; _log(level, this.prefix, ...args); this._metrics[`${level}Count`]++; this._metrics.lastLogAt = Date.now(); }
  setLevel(level: string) { if (this.levels[level] !== undefined) this.level = level; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  healthCheck() { const checks = { enabled: this.enabled, validLevel: this.levels[this.level] !== undefined }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info2() { return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, level: this.level, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0, lastLogAt: null }; }
  static getLogs() { return [..._logBuffer]; }
}
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getLogs() { return [..._logBuffer]; }
export default Logger;
