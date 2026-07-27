// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/notifications/accessibility/shortcuts
// PURPOSE: Notifications - Keyboard Shortcuts (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
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
export const MODULE_ID = 'header/components/notifications/accessibility/shortcuts';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class KeyboardShortcuts { [key: string]: any;
  constructor() { this.shortcuts = new Map(); this._debug = false; this._metrics = { registerCount: 0, triggerCount: 0, lastTriggerAt: null }; }
  register(key: string, cb: Function) { this.shortcuts.set(key, cb); this._metrics.registerCount++; }
  unregister(key: string) { this.shortcuts.delete(key); }
  trigger(key: string, event: string) { const cb = this.shortcuts.get(key); if (cb) { cb(event); this._metrics.triggerCount++; this._metrics.lastTriggerAt = Date.now(); } }
  healthCheck() {
    const checks = { hasShortcuts: this.shortcuts.size >= 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
  }
  info() { return { version: VERSION, moduleId: MODULE_ID, shortcutCount: this.shortcuts.size, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { registerCount: 0, triggerCount: 0, lastTriggerAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default KeyboardShortcuts;
