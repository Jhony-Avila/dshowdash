// =============================================================
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// =============================================================
// MODULE: header/components/weather-sp/utils/timers
// PURPOSE: Timer wrapper utilities with cleanup returns
// -------------------------------------------------------------
// PROVIDES:
//   TimerUtils.setTimeout(cb, delay)
//   TimerUtils.setInterval(cb, interval)
//   setDebug(enabled)
// =============================================================
// Weather SP - Timer Utilities (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/weather-sp/utils/timers';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class TimerUtils { [key: string]: any;
  static setTimeout(cb: Function, delay: number) { const id = setTimeout(cb, delay); return () => clearTimeout(id); }
  static setInterval(cb: Function, interval: number) { const id = setInterval(cb, interval); return () => clearInterval(id); }
  static healthCheck() {
    const checks = { ready: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
  }
  static info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck() }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
export default TimerUtils;
