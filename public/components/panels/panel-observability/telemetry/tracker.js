import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-observability/telemetry/tracker";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function Tracker(o = {}) {
  o = o || {};
  this.moduleId = o.moduleId || MODULE_ID;
  this.enabled = o.enabled !== false;
  this._events = [];
  this._max = 1e3;
}
Tracker.prototype.track = function(e, d) {
  if (!this.enabled) return;
  const entry = { event: e, data: d || {}, moduleId: this.moduleId, timestamp: Date.now() };
  this._events.push(entry);
  if (this._events.length > this._max) this._events.shift();
  const eb = Ports.get("eventBus");
  if (eb?.emit) eb.emit(TELEMETRY_INTENTS.TRACK, entry);
};
Tracker.prototype.getEvents = function() {
  return this._events.slice();
};
Tracker.prototype.clear = function() {
  this._events.length = 0;
};
Tracker.prototype.healthCheck = function() {
  return { status: "healthy", enabled: this.enabled, eventCount: this._events.length, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true, version: VERSION, moduleId: MODULE_ID };
};
Tracker.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, portsInitialized: Ports.isInitialized(), usingP18Intents: true };
};
function init(ctx) {
  Ports.init();
  if (ctx?.ports) Ports.inject(ctx.ports);
  return { ok: true, version: VERSION };
}
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
