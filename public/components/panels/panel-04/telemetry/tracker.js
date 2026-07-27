import { TELEMETRY_EVENTS } from "/core/runtime/events/catalog/telemetry.events.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PAINEL_ID, VERSION as PANEL_VERSION } from "../core/constants.js";
const MODULE_ID = "panel-04.telemetry.tracker";
const VERSION = "9.3.0-P2-ENTERPRISE";
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
function PanelTelemetryTracker(panelId, version) {
  if (panelId === void 0) panelId = PAINEL_ID;
  if (version === void 0) version = PANEL_VERSION;
  this.panelId = panelId;
  this.version = version;
  this.sessionId = this._generateSessionId();
  this.events = [];
  this.maxEvents = 100;
  _initPorts();
}
PanelTelemetryTracker.prototype._generateSessionId = () => `sess-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
PanelTelemetryTracker.prototype.track = function(eventName, data = {}) {
  if (data === void 0) data = {};
  const event = { timestamp: (/* @__PURE__ */ new Date()).toISOString(), panelId: this.panelId, version: this.version, sessionId: this.sessionId, event: eventName, data };
  this.events.push(event);
  if (this.events.length > this.maxEvents) this.events = this.events.slice(-this.maxEvents);
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) eventBus.emit(TELEMETRY_EVENTS.EVENT, event);
  const cfg = _getPort("config");
  const logger = _getPort("logger");
  if (cfg && cfg.app && cfg.app.debug && logger && logger.debug) logger.debug(`[${this.panelId}:telemetry]`, eventName, data);
  return event;
};
PanelTelemetryTracker.prototype.getEvents = function() {
  return this.events.slice();
};
PanelTelemetryTracker.prototype.getLastEvent = function() {
  return this.events[this.events.length - 1] || null;
};
PanelTelemetryTracker.prototype.clear = function() {
  this.events = [];
};
PanelTelemetryTracker.prototype.getSummary = function() {
  const eventCounts = {};
  for (let i = 0; i < this.events.length; i++) {
    const e = this.events[i];
    eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
  }
  return { panelId: this.panelId, version: this.version, sessionId: this.sessionId, totalEvents: this.events.length, eventCounts, firstEvent: this.events[0] ? this.events[0].timestamp : null, lastEvent: this.events[this.events.length - 1] ? this.events[this.events.length - 1].timestamp : null };
};
PanelTelemetryTracker.prototype.info = () => ({
  moduleId: MODULE_ID,
  version: VERSION
});
PanelTelemetryTracker.prototype.healthCheck = function() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, sessionId: this.sessionId, eventsTracked: this.events.length };
};
var tracker_default = PanelTelemetryTracker;
export {
  MODULE_ID,
  PanelTelemetryTracker,
  VERSION,
  tracker_default as default,
  getPorts,
  injectPorts
};
