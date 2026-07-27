// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04.telemetry.tracker
// PURPOSE: Panel-04 Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TELEMETRY_EVENTS from /core/runtime/events/catalog/telemetry.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PAINEL_ID, VERSION as PANEL_VERSION from ../core/constants.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   PanelTelemetryTracker() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TELEMETRY_EVENTS.EVENT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PAINEL_ID, VERSION as PANEL_VERSION } from '../core/constants.js';

const MODULE_ID = 'panel-04.telemetry.tracker';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function PanelTelemetryTracker(this: any, panelId: string, version: string) {
  if (panelId === undefined) panelId = PAINEL_ID;
  if (version === undefined) version = PANEL_VERSION;
  this.panelId = panelId;
  this.version = version;
  this.sessionId = this._generateSessionId();
  this.events = [];
  this.maxEvents = 100;
  _initPorts();
}

PanelTelemetryTracker.prototype._generateSessionId = () => `sess-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

PanelTelemetryTracker.prototype.track = function(eventName: string, data: Record<string, unknown> = {}) {
  if (data === undefined) data = {};
  const event = { timestamp: new Date().toISOString(), panelId: this.panelId, version: this.version, sessionId: this.sessionId, event: eventName, data };
  this.events.push(event);
  if (this.events.length > this.maxEvents) this.events = this.events.slice(-this.maxEvents);
  const eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) eventBus.emit(TELEMETRY_EVENTS.EVENT, event);
  const cfg = _getPort('config'); const logger = _getPort('logger'); if (cfg && cfg.app && cfg.app.debug && logger && logger.debug) logger.debug(`[${this.panelId}:telemetry]`, eventName, data);
  return event;
};

PanelTelemetryTracker.prototype.getEvents = function() { return this.events.slice(); };
PanelTelemetryTracker.prototype.getLastEvent = function() { return this.events[this.events.length - 1] || null; };
PanelTelemetryTracker.prototype.clear = function() { this.events = []; };

PanelTelemetryTracker.prototype.getSummary = function() {
  const eventCounts: Record<string, number> = {};
  for (let i = 0; i < this.events.length; i++) { const e = this.events[i]; eventCounts[e.event] = (eventCounts[e.event] || 0) + 1; }
  return { panelId: this.panelId, version: this.version, sessionId: this.sessionId, totalEvents: this.events.length, eventCounts, firstEvent: this.events[0] ? this.events[0].timestamp : null, lastEvent: this.events[this.events.length - 1] ? this.events[this.events.length - 1].timestamp : null };
};

PanelTelemetryTracker.prototype.info = () => ({
  moduleId: MODULE_ID,
  version: VERSION
});
PanelTelemetryTracker.prototype.healthCheck = function() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, sessionId: this.sessionId, eventsTracked: this.events.length }; };

export { PanelTelemetryTracker, VERSION, MODULE_ID };
export default PanelTelemetryTracker;
