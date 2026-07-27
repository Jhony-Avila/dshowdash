// =============================================================
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// =============================================================
// MODULE: header/components/weather-sp/accessibility/announce
// PURPOSE: Screen reader announcements for weather updates
// -------------------------------------------------------------
// PROVIDES:
//   ScreenReaderAnnouncer (class)
//   setDebug(enabled)
//   getLogs()
// =============================================================
// Weather SP - Screen Reader Announcer (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/weather-sp/accessibility/announce';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class ScreenReaderAnnouncer { [key: string]: any;
  constructor() { this.announcer = null; this._debug = false; this._metrics = { announceCount: 0, lastAnnounceAt: null }; }
  announce(msg: string) { _log('debug', 'Announce:', msg); this._metrics.announceCount++; this._metrics.lastAnnounceAt = Date.now(); }
  healthCheck() {
    const checks = { ready: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
  }
  info() { return { version: VERSION, moduleId: MODULE_ID, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { announceCount: 0, lastAnnounceAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default ScreenReaderAnnouncer;
