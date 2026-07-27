// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-status-mode
// PURPOSE: status-mode Icon - Entry Point
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Controller from ./core/controller.js
//   Lifecycle from ./core/lifecycle.js
//   Store from ./state/store.js
//   Template from ./ui/template.js
//   States from ./ui/states.js
//   Tracker from ./telemetry/tracker.js
//   Logger from ./telemetry/logger.js
//
// PROVIDES:
//   StatusModeIcon — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { Controller } from './core/controller.js';
import { Lifecycle } from './core/lifecycle.js';
import { Store } from './state/store.js';
import { Template } from './ui/template.js';
import { States } from './ui/states.js';
import { Tracker } from './telemetry/tracker.js';
import { Logger } from './telemetry/logger.js';

const MODULE_ID = 'footer-icon-status-mode';
const VERSION = '1.0.1-ENTERPRISE';

function _log(level: string, ...args: unknown[]) {
  if (Logger && typeof (Logger as Record<string,unknown>)[level as string] === 'function') {
    // @ts-expect-error TS migration - TS2349
    (Logger as Record<string,unknown>)[level as string]('[STATUS-MODE]', ...args);
  }
}

const StatusModeIcon = {
  getVersion() { return VERSION; },
  getModuleId() { return MODULE_ID; },

  // @ts-expect-error TS migration - TS2554
  async init(o: Record<string, unknown> = {}) { _log('info', 'Init'); return await Controller.init(o); },
  async mount(c: unknown, p: Record<string, unknown> = {}) {
    try {
      // @ts-expect-error TS migration - TS2345
      const r = await Controller.mount(c, p);

      // @ts-expect-error TS migration - TS2339
      Store.setProps(r.props); Store.setMode(r.props.mode || 'normal'); Store.markRender(); Tracker.trackMount(); Tracker.trackRender(r.props);
      return r;
    } catch (e: any) { Tracker.trackError(e); _log('error', 'Mount failed:', e.message); throw e; }
  },
  render(p: Record<string, unknown> = {}) { Store.setProps(p); Store.setMode(p.mode || 'normal'); Store.markRender(); Tracker.trackRender(p); return Template.render(p); },
  setMode(mode: string) {
    const el = Lifecycle.getContainer()?.querySelector('.dsd-icon--status-mode');
    if (el) {
      const oldMode = Store.getMode();

      // @ts-expect-error TS migration - TS2339
      States.applyMode(el, mode);
      Store.setMode(mode);

      // @ts-expect-error TS migration - TS2339
      Tracker.trackModeChange();
      _log('info', 'Mode changed:', oldMode, '->', mode);
    }
  },
  getMode() { return Store.getMode(); },
  async unmount() { (Tracker as any).trackUnmount(); const r = await Controller.unmount(); Store.reset(); return r; },
  async destroy() { const r = await Controller.destroy(); Store.reset(); Tracker.reset(); return r; },
  healthCheck() {
    const l = Lifecycle.info(), m = Tracker.getMetrics();

    // @ts-expect-error TS migration - TS2339
    const c = { isReady: l.isReady || l.phase === 'idle', noErrors: m.errors === 0 };
    const p = Object.values(c).filter(Boolean).length;
    return { status: p === 2 ? 'HEALTHY' : 'DEGRADED', score: `${p}/2`, checks: c, currentMode: Store.getMode(), version: VERSION, timestamp: Date.now() };
  },
  info() {
    return {
      moduleId: MODULE_ID, version: VERSION, lifecycle: Lifecycle.info(), currentMode: Store.getMode(),
      metrics: Tracker.getMetrics(), availableModes: ['normal', 'maintenance', 'p0', 'incident', 'degraded'], timestamp: Date.now()
    };
  }
};

if (typeof window !== 'undefined') {
  window.__dev = window.__dev || {};
  // @ts-expect-error TS migration - TS2345
  window.__dev.footerIconStatusMode = { getVersion: () => VERSION, info: () => StatusModeIcon.info(), healthCheck: () => StatusModeIcon.healthCheck(), setMode: (m: unknown) => StatusModeIcon.setMode(m) };
}

export default StatusModeIcon;
export { StatusModeIcon, MODULE_ID, VERSION };
