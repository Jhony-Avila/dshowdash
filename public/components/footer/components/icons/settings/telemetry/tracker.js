import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_EVENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const MODULE_ID = "footer.icon.settings.tracker";
const VERSION = "2.2.0-P18EC";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _m = { renders: 0, clicks: 0, errors: 0, mounts: 0, unmounts: 0 };
const Tracker = {
  trackRender(p) {
    _m.renders++;
    this._emit(TELEMETRY_EVENTS.COMPONENT_RENDER, { props: p });
  },
  trackClick(p) {
    _m.clicks++;
    this._emit(TELEMETRY_EVENTS.COMPONENT_INTERACTION, { props: p, action: "click" });
  },
  trackMount() {
    _m.mounts++;
    this._emit(TELEMETRY_EVENTS.COMPONENT_MOUNT, {});
  },
  trackUnmount() {
    _m.unmounts++;
    this._emit(TELEMETRY_EVENTS.COMPONENT_UNMOUNT, {});
  },
  // @ts-expect-error TS migration - TS2339
  trackError(e) {
    _m.errors++;
    this._emit(TELEMETRY_EVENTS.ERROR, { message: e && e.message ? e.message : String(e) });
  },
  _emit(eventType, d) {
    const t = Ports.get("telemetry");
    if (t && t.track) t.track(eventType, Object.assign({ moduleId: MODULE_ID }, d));
  },
  getMetrics() {
    return Object.assign({}, _m);
  },
  reset() {
    for (const k in _m) _m[k] = 0;
  }
};
function getMetrics() {
  return Tracker.getMetrics();
}
function init(ctx) {
  Ports.init();
  if (ctx && ctx.ports) Ports.inject(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: Ports.isInitialized() };
}
var tracker_default = Object.assign({}, Tracker, { init, info, healthCheck, MODULE_ID, VERSION, injectPorts, getPorts });
export {
  MODULE_ID,
  Tracker,
  VERSION,
  tracker_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts
};
