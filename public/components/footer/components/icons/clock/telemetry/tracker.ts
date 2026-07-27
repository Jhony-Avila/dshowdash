// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-clock-tracker
// PURPOSE: Clock Icon - Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTelemetryPorts from /core/runtime/ports-profiles.js
//   TELEMETRY_EVENTS from /core/runtime/events/catalog/telemetry.events.js
//
// PROVIDES:
//   Tracker — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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
import { createTelemetryPorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';
const MODULE_ID = 'footer-icon-clock-tracker';
const VERSION = '2.0.0-P18EC';
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _m = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 };
export const Tracker = {
  trackRender(p: Record<string,unknown>) { _m.renders++; this._emit(TELEMETRY_EVENTS.COMPONENT_RENDER, { props: p }); },
  trackClick(p: Record<string,unknown>) { _m.clicks++; this._emit(TELEMETRY_EVENTS.COMPONENT_INTERACTION, { props: p, action: 'click' }); },
  trackMount() { _m.mounts++; this._emit(TELEMETRY_EVENTS.COMPONENT_MOUNT, {}); },
  trackUnmount() { _m.unmounts++; this._emit(TELEMETRY_EVENTS.COMPONENT_UNMOUNT, {}); },
  // @ts-expect-error TS migration - TS2339
  trackError(e: Event) { _m.errors++; this._emit(TELEMETRY_EVENTS.ERROR, { message: e.message || String(e) }); },
  _emit(eventType: string, d: unknown) { const t = _getPort('telemetry'); if (t && t.track) t.track(eventType, Object.assign({ moduleId: MODULE_ID }, d)); },
  getMetrics() { return Object.assign({}, _m); },
  reset() { const keys = Object.keys(_m); for (let i = 0; i < keys.length; i++) (_m as Record<string,unknown>)[keys[i]] = 0; }
};
export function getMetrics() { return Tracker.getMetrics(); }
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: ps._initialized }; }
export function healthCheck() { const ps = Ports.snapshot(); const telemetryAvailable = !!_getPort('telemetry'); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { telemetryAvailable, portsInitialized: ps._initialized }, metrics: getMetrics() }; }
export { MODULE_ID, VERSION };
export default Object.assign({}, Tracker, { info, healthCheck, MODULE_ID, VERSION });
