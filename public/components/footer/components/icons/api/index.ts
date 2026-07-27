// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-api
// PURPOSE: api Icon - Entry Point
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Controller from ./core/controller.js
//   Lifecycle from ./core/lifecycle.js
//   Store from ./state/store.js
//   Template from ./ui/template.js
//   Tracker from ./telemetry/tracker.js
//   Logger from ./telemetry/logger.js
//
// PROVIDES:
//   ApiIcon — exported value
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
import { Tracker } from './telemetry/tracker.js';
import { Logger } from './telemetry/logger.js';

const MODULE_ID = 'footer-icon-api';
const VERSION = '1.0.1-ENTERPRISE';

function _log(level: string, ...args: unknown[]) {
  if (Logger && typeof (Logger as Record<string,unknown>)[level as string] === 'function') {
    // @ts-expect-error TS migration - TS2349
    (Logger as Record<string,unknown>)[level as string]('[API]', ...args);
  }
}

const ApiIcon = {
  getVersion() { return VERSION; },
  getModuleId() { return MODULE_ID; },

  // @ts-expect-error TS migration - TS2554
  async init(o = {}) { _log('info', 'Init'); return await Controller.init(o); },
  async mount(c: unknown, p = {}) {
    try {
      // @ts-expect-error TS migration - TS2345
      const r = await Controller.mount(c, p);
      Store.setProps(r.props); Store.markRender(); Tracker.trackMount(); Tracker.trackRender(r.props);
      return r;
    } catch (e: any) { Tracker.trackError(e); _log('error', 'Mount failed:', e.message); throw e; }
  },
  render(p = {}) { Store.setProps(p); Store.markRender(); Tracker.trackRender(p); return Template.render(p); },
  async unmount() { Tracker.trackUnmount(); const r = await Controller.unmount(); Store.reset(); return r; },
  async destroy() { const r = await Controller.destroy(); Store.reset(); Tracker.reset(); return r; },
  healthCheck() {
    const l = (Lifecycle as any).info(), m = Tracker.getMetrics();
    const c = { isReady: l.isReady || l.phase === 'idle', noErrors: m.errors === 0 };
    const p = Object.values(c).filter(Boolean).length;
    return { status: p === 2 ? 'HEALTHY' : 'DEGRADED', score: `${p}/2`, checks: c, version: VERSION, timestamp: Date.now() };
  },
  info() { return { moduleId: MODULE_ID, version: VERSION, lifecycle: Lifecycle.info(), metrics: Tracker.getMetrics(), timestamp: Date.now() }; }
};

if (typeof window !== 'undefined') {
  window.__dev = window.__dev || {};
  window.__dev.footerIconApi = { getVersion: () => VERSION, info: () => ApiIcon.info(), healthCheck: () => ApiIcon.healthCheck() };
}

export default ApiIcon;
export { ApiIcon, MODULE_ID, VERSION };
