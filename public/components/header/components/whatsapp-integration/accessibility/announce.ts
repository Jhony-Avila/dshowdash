// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/whatsapp-integration/accessibility/announce
// PURPOSE: WhatsApp Integration - Screen Reader Announcer (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getAnnouncerRoot from ../../../utils/overlay-root.js
//
// PROVIDES:
//   VERSION — module constant
//   ScreenReaderAnnouncer() — exported function
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

import { getAnnouncerRoot } from '../../../utils/overlay-root.js';

export const VERSION = '5.2.0-ES6';
export const MODULE_ID = 'header/components/whatsapp-integration/accessibility/announce';
let _debug = false;
// @ts-expect-error strict migration — TS7034
const _logBuffer = [];

// @ts-expect-error strict migration — TS7005
function _log(level: string) { const args = Array.prototype.slice.call(arguments, 1); if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export function ScreenReaderAnnouncer(this: any) { this.announcer = null; this._metrics = { announceCount: 0, lastAnnounceAt: null }; }

ScreenReaderAnnouncer.prototype.init = function() {
  if (this.announcer) return;
  this.announcer = document.createElement('div');
  this.announcer.setAttribute('aria-live', 'polite');
  this.announcer.setAttribute('data-announcer', MODULE_ID);
  this.announcer.className = 'sr-only';
  this.announcer.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
  getAnnouncerRoot().appendChild(this.announcer);
};

ScreenReaderAnnouncer.prototype.announce = function(msg: string) { const self = this; self.init(); self.announcer.textContent = ''; setTimeout(() => { self.announcer.textContent = msg; }, 100); self._metrics.announceCount++; self._metrics.lastAnnounceAt = Date.now(); };
ScreenReaderAnnouncer.prototype.destroy = function() { if (this.announcer) { this.announcer.remove(); this.announcer = null; } };
ScreenReaderAnnouncer.prototype.healthCheck = () => { const checks = { ready: true, noBodyAppend: true }; let passed = 0; for (const k in checks) if ((checks as Record<string,unknown>)[k]) passed++; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; };
ScreenReaderAnnouncer.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, initialized: !!this.announcer, metrics: this._metrics, healthCheck: this.healthCheck() }; };
ScreenReaderAnnouncer.prototype.setDebug = (enabled: boolean) => { _debug = !!enabled; };
ScreenReaderAnnouncer.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
ScreenReaderAnnouncer.prototype.resetMetrics = function() { this._metrics = { announceCount: 0, lastAnnounceAt: null }; };
// @ts-expect-error strict migration — TS7005
ScreenReaderAnnouncer.getLogs = () => _logBuffer.slice();

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return _logBuffer.slice(); }
export default ScreenReaderAnnouncer;
