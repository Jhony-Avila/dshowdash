// =============================================================
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// =============================================================
// MODULE: header/components/weather-sp/state/validators
// PURPOSE: State validation functions for weather data integrity
// -------------------------------------------------------------
// PROVIDES:
//   StateValidators.validateTemperature(temp)
//   StateValidators.validateState(state)
//   setDebug(enabled)
// =============================================================
// Weather SP - State Validators (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/weather-sp/state/validators';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class StateValidators { [key: string]: any;
  static validateTemperature(temp: unknown) { if (temp !== null && (typeof temp !== 'number' || temp < -100 || temp > 100)) throw new Error(`Invalid temperature: ${temp}`); return true; }
  static validateState(state: Record<string,unknown>) { if (!state || typeof state !== 'object') throw new Error('State must be an object'); return true; }
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
export default StateValidators;
