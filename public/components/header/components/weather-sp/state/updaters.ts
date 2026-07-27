// =============================================================
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// =============================================================
// MODULE: header/components/weather-sp/state/updaters
// PURPOSE: Pure state update functions for weather state transitions
// -------------------------------------------------------------
// PROVIDES:
//   StateUpdaters.update()
//   StateUpdaters.updateWeather()
//   setDebug(enabled)
// =============================================================
// Weather SP - State Updaters (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/weather-sp/state/updaters';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class StateUpdaters { [key: string]: any;
  // @ts-expect-error TS migration - TS2698
  static update(currentState: string, updates: Record<string,unknown>) { return { ...currentState, ...updates, lastUpdate: Date.now() }; }
  // @ts-expect-error TS migration - TS2698
  static updateWeather(currentState: string, weather: Record<string,unknown>) { return { ...currentState, weather, lastUpdate: Date.now() }; }
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
export default StateUpdaters;
