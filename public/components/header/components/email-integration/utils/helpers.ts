// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/email-integration/utils/helpers
// PURPOSE: General helper utilities for email component
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   Helpers — static utility methods class
//   setDebug(enabled) — toggle debug mode
//   Helpers (default) — default export
// ═══════════════════════════════════════════════════════════════
// Email Integration - Helper Utilities (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/email-integration/utils/helpers';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class Helpers { [key: string]: any;
  static generateId(prefix = 'email') { return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
  // @ts-expect-error TS migration - TS2345
  static isValidEmail(email: unknown) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
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
export default Helpers;
