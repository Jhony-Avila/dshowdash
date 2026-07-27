import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const MODULE_ID = "panels.panel-status-instagram-messenger.telemetry.tracker";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
class Tracker {
  constructor(options = {}) {
    this.moduleId = options.moduleId || MODULE_ID;
    this.enabled = options.enabled !== false;
    this._events = [];
    this._maxEvents = 1e3;
  }
  track(event, data = {}) {
    if (!this.enabled) return;
    const entry = { event, data, moduleId: this.moduleId, timestamp: Date.now() };
    this._events.push(entry);
    if (this._events.length > this._maxEvents) this._events.shift();
    const eb = Ports.get("eventBus");
    eb?.emit?.(TELEMETRY_INTENTS.TRACK, entry);
  }
  getEvents() {
    return [...this._events];
  }
  clear() {
    this._events.length = 0;
  }
  healthCheck() {
    return { status: "healthy", enabled: this.enabled, eventCount: this._events.length, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, portsInitialized: Ports.isInitialized(), usingP18Intents: true };
  }
}
const init = (ctx) => {
  Ports.init();
  if (ctx?.ports) Ports.inject(ctx.ports);
  return { ok: true, version: VERSION };
};
var tracker_default = Tracker;
export {
  MODULE_ID,
  Tracker,
  VERSION,
  tracker_default as default,
  getPorts,
  init,
  injectPorts
};
