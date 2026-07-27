// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-loja-integrada/accessibility/announce
// PURPOSE: Screen reader announcer for accessibility support
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getAnnouncerRoot from ../../../utils/overlay-root.js
// PROVIDES:
//   ScreenReaderAnnouncer — class for aria-live announcements
//   healthCheck() — module health status
// ═══════════════════════════════════════════════════════════════
// panel-loja-integrada - Screen Reader Announcer (Enterprise)
// @version 8.1.0-ENTERPRISE
'use strict';

import { getAnnouncerRoot } from '../../../utils/overlay-root.js';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-loja-integrada/accessibility/announce';

let _debug = false;

export class ScreenReaderAnnouncer {
  [key: string]: any;
  constructor() { this.announcer = null; this._metrics = { announceCount: 0, lastAnnounceAt: null }; }
  
  init() {
    if (this.announcer) return;
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('data-announcer', MODULE_ID);
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    const root = typeof getAnnouncerRoot === 'function' ? getAnnouncerRoot() : document.body;
    root.appendChild(this.announcer);
  }
  
  announce(msg: string) {
    this.init();
    this.announcer.textContent = '';
    setTimeout(() => { this.announcer.textContent = msg; }, 100);
    this._metrics.announceCount++;
    this._metrics.lastAnnounceAt = Date.now();
  }
  
  destroy() { if (this.announcer) { this.announcer.remove(); this.announcer = null; } }
  
  healthCheck() {
    const checks = { ready: true, initialized: !!this.announcer };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
  }
  
  info() { return { version: VERSION, moduleId: MODULE_ID, initialized: !!this.announcer, metrics: this._metrics }; }
  setDebug(enabled: boolean) { _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { announceCount: 0, lastAnnounceAt: null }; }
}

export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }
export default ScreenReaderAnnouncer;
