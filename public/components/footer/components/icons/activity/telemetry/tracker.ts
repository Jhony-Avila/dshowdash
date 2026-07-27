// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer.icon.activity.tracker
// PURPOSE: Footer icon activity - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   TELEMETRY_EVENTS from /core/runtime/events/catalog/telemetry.events.js
//
// PROVIDES:
//   Tracker — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getMetrics() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';
const MODULE_ID = 'footer.icon.activity.tracker';
const VERSION = '2.2.0-P18EC';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _m = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 };
export const Tracker = {
  trackRender(p: Record<string,unknown>) { _m.renders++; this._emit(TELEMETRY_EVENTS.COMPONENT_RENDER, { props: p }); },
  trackClick(p: Record<string,unknown>) { _m.clicks++; this._emit(TELEMETRY_EVENTS.COMPONENT_INTERACTION, { props: p, action: 'click' }); },
  trackMount() { _m.mounts++; this._emit(TELEMETRY_EVENTS.COMPONENT_MOUNT, {}); },
  trackUnmount() { _m.unmounts++; this._emit(TELEMETRY_EVENTS.COMPONENT_UNMOUNT, {}); },
  // @ts-expect-error TS migration - TS2339
  trackError(e: Event) { _m.errors++; this._emit(TELEMETRY_EVENTS.ERROR, { message: e && e.message ? e.message : String(e) }); },
  _emit(eventType: string, d: unknown) { const t = Ports.get('telemetry'); if (t && t.track) t.track(eventType, Object.assign({ moduleId: MODULE_ID }, d)); },
  getMetrics() { return Object.assign({}, _m); },
  reset() { for (const k in _m) (_m as Record<string,unknown>)[k] = 0; }
};
export function getMetrics() { return Tracker.getMetrics(); }
function init(ctx: Record<string,unknown>) { Ports.init(); if (ctx && ctx.ports) Ports.inject(ctx.ports); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: Ports.isInitialized() }; }
export { MODULE_ID, VERSION, init, healthCheck, info };
export default Object.assign({}, Tracker, { init, info, healthCheck, MODULE_ID, VERSION, injectPorts, getPorts });
