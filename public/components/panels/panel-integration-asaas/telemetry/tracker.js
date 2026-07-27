import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-integration-asaas.telemetry.tracker";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
class Tracker {
  constructor(options = {}) {
    _initPorts();
    this.moduleId = options.moduleId || "panel-integration-asaas";
    this.enabled = options.enabled !== false;
    this._events = [];
    this._maxEvents = options.maxEvents || 1e3;
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
    return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", enabled: this.enabled, eventCount: this._events.length, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, portsInitialized: Ports.isInitialized(), usingP18Intents: true, healthCheck: this.healthCheck() };
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
