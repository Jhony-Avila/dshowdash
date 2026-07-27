import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-integration-bling/telemetry/tracker";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
class Tracker {
  constructor(options = {}) {
    this.moduleId = options.moduleId || "panels/panel-integration-bling";
    this.enabled = options.enabled !== false;
    this._events = [];
    this._maxEvents = options.maxEvents || 1e3;
    _initPorts();
  }
  track(event, data = {}) {
    if (!this.enabled) return;
    const entry = { event, data, moduleId: this.moduleId, timestamp: Date.now() };
    this._events.push(entry);
    if (this._events.length > this._maxEvents) this._events.shift();
    _getPort("eventBus")?.emit?.(TELEMETRY_INTENTS.TRACK, entry);
  }
  getEvents() {
    return [...this._events];
  }
  getEventsByType(event) {
    return this._events.filter((e) => e.event === event);
  }
  clear() {
    this._events.length = 0;
  }
  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    return { status: portsSnapshot._initialized ? "HEALTHY" : "DEGRADED", enabled: this.enabled, eventCount: this._events.length, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, p18IntentsAvailable: true };
  }
  info() {
    const portsSnapshot = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, healthCheck: this.healthCheck(), portsInitialized: portsSnapshot._initialized, usingP18Intents: true };
  }
}
var tracker_default = Tracker;
export {
  MODULE_ID,
  Tracker,
  VERSION,
  tracker_default as default,
  getPorts,
  injectPorts
};
