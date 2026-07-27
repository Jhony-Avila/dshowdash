// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer/components/status-lang/utils/formatters
// PURPOSE: Status Lang - Formatters (Enterprise)
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
//   Formatters — exported class
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'footer/components/status-lang/utils/formatters';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class Formatters {
  // @ts-expect-error TS migration - TS2339
  static formatLanguageCode(code: unknown) { const labels = { 'pt-BR': 'PT', 'en-US': 'EN', 'es-ES': 'ES', 'zh-CN': 'ZH' }; return (labels as Record<string,unknown>)[code as string] || code.substring(0, 2).toUpperCase(); }
  static formatLanguageName(code: unknown) { const names = { 'pt-BR': 'Português', 'en-US': 'English', 'es-ES': 'Español', 'zh-CN': '中文' }; return (names as Record<string,unknown>)[code as string] || code; }
  static healthCheck() { const checks = { ready: true }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  static info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck() }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default Formatters;
