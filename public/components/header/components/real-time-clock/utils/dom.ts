// =============================================================
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// =============================================================
// MODULE: header/components/real-time-clock/utils/dom
// PURPOSE: DOM utility functions for element creation
// -------------------------------------------------------------
// PROVIDES:
//   DOMUtils.createElement(tag, attrs)
//   setDebug(enabled)
//   getLogs()
// =============================================================
// Real Time Clock - DOM Utilities (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/real-time-clock/utils/dom';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class DOMUtils { [key: string]: any;
  static createElement(tag: string, attrs = {}) {
    const el = document.createElement(tag);
    // @ts-expect-error TS migration - TS2322, TS2345
    Object.entries(attrs).forEach(([k, v]) => { if (k === 'className') el.className = v; else el.setAttribute(k, v); });
    return el;
  }
  static healthCheck() {
    const checks = { documentReady: !!document.body };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
  }
  static info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck() }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default DOMUtils;
