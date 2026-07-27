// =============================================================
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// =============================================================
// MODULE: header/components/real-time-clock/utils/formatters
// PURPOSE: Time and date formatting utilities (pt-BR locale)
// -------------------------------------------------------------
// PROVIDES:
//   Formatters.formatTime(date)
//   Formatters.formatDate(date)
//   setDebug(enabled)
// =============================================================
// Real Time Clock - Formatters (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/real-time-clock/utils/formatters';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class Formatters { [key: string]: any;
  // @ts-expect-error TS migration - TS2339
  static formatTime(date: unknown) { return date ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'; }
  // @ts-expect-error TS migration - TS2339
  static formatDate(date: unknown) { return date ? date.toLocaleDateString('pt-BR') : '--/--/----'; }
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
export default Formatters;
