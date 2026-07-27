// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-device-webcam
// PURPOSE: device-webcam Icon - Entry Point
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
//   DeviceWebcamIcon — exported value
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
const MODULE_ID = 'footer-icon-device-webcam';
const VERSION = '1.0.1-ENTERPRISE';
// @ts-expect-error TS migration - TS2349
function _log(level: string, ...args: unknown[]) { if (Logger && typeof (Logger as Record<string,unknown>)[level as string] === 'function') { (Logger as Record<string,unknown>)[level as string]('[DEVICE-WEBCAM]', ...args); } }
const DeviceWebcamIcon = {
  getVersion() { return VERSION; },
  getModuleId() { return MODULE_ID; },

  // @ts-expect-error TS migration - TS2554
  async init(o: Record<string, unknown> = {}) { _log('info', 'Init'); return await Controller.init(o); },
  // @ts-expect-error TS migration - TS2345
  async mount(c: unknown, p: Record<string, unknown> = {}) { try { const r = await Controller.mount(c, p); Store.setProps(r.props); Store.setMode((r.props as any).mode || 'on'); Store.markRender(); Tracker.trackMount(); Tracker.trackRender(r.props); return r; } catch (e) { Tracker.trackError(e); _log('error', 'Mount failed:', e.message); throw e; } },
  render(p: Record<string, unknown> = {}) { Store.setProps(p); Store.setMode(p.mode || 'on'); Store.markRender(); Tracker.trackRender(p); return Template.render(p); },

  // @ts-expect-error TS migration - TS2339
  setMode(mode) { const el = Lifecycle.getContainer()?.querySelector('.dsd-icon--device-webcam'); if (el) { const oldMode = Store.getMode(); States.applyMode(el, mode); Store.setMode(mode); Tracker.trackModeChange(); _log('info', 'Mode changed:', oldMode, '->', mode); } },
  toggle() { const current = Store.getMode(); this.setMode(current === 'on' ? 'off' : 'on'); },
  isOn() { return Store.getMode() === 'on'; },
  async unmount() { Tracker.trackUnmount(); const r = await Controller.unmount(); (Store.reset() as any); return r; },
  async destroy() { const r = await Controller.destroy(); Store.reset(); Tracker.reset(); return r; },

  // @ts-expect-error TS migration - TS2339
  healthCheck() { const l = Lifecycle.info(), m = Tracker.getMetrics(); const c = { isReady: l.isReady || l.phase === 'idle', noErrors: m.errors === 0 }; const p = Object.values(c).filter(Boolean).length; return { status: p === 2 ? 'HEALTHY' : 'DEGRADED', score: `${p}/2`, checks: c, currentMode: Store.getMode(), version: VERSION, timestamp: Date.now() }; },
  info() { return { moduleId: MODULE_ID, version: VERSION, lifecycle: Lifecycle.info(), currentMode: Store.getMode(), isOn: this.isOn(), metrics: Tracker.getMetrics(), timestamp: Date.now() }; }
};
if (typeof window !== 'undefined') { window.__dev = window.__dev || {}; window.__dev.footerIconDeviceWebcam = { getVersion: () => VERSION, info: () => DeviceWebcamIcon.info(), healthCheck: () => DeviceWebcamIcon.healthCheck(), toggle: () => DeviceWebcamIcon.toggle() }; }
export default DeviceWebcamIcon;
export { DeviceWebcamIcon, MODULE_ID, VERSION };
