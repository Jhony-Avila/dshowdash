// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/instagram-messenger-integration/ui/ripple
// PURPOSE: Material Design ripple effect for Instagram integration click feedback
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   RippleEffect — Class for attaching ripple animations to elements
//   setDebug() — Toggle debug mode
//   getLogs() — Retrieve internal log buffer
// ═══════════════════════════════════════════════════════════════
// Instagram Messenger Integration - Ripple Effect (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/instagram-messenger-integration/ui/ripple';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class RippleEffect { [key: string]: any;
  constructor(options: { duration?: number } = {}) { this.duration = options.duration || 600; this._debug = false; this._metrics = { rippleCount: 0, lastRippleAt: null }; }
  attach(element: HTMLElement|null) {
    if (!element) return;
    element.addEventListener('click', (e: Event) => {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      element.appendChild(ripple);
      setTimeout(() => ripple.remove(), this.duration);
      this._metrics.rippleCount++;
      this._metrics.lastRippleAt = Date.now();
    });
  }
  healthCheck() {
    const checks = { ready: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
  }
  info() { return { version: VERSION, moduleId: MODULE_ID, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { rippleCount: 0, lastRippleAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default RippleEffect;
