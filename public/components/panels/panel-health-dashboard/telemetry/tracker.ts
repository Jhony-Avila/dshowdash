// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-health-dashboard/telemetry/tracker
// PURPOSE: Health Dashboard - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/catalog/telemetry.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   Tracker() — exported function
//   init() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TELEMETRY_INTENTS.TRACK
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-health-dashboard/telemetry/tracker';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function Tracker(this: any, o: Record<string, any> = {}) {
  this.moduleId = o.moduleId || MODULE_ID;
  this.enabled = o.enabled !== false;
  this._events = [];
  this._max = 1000;
}

Tracker.prototype.track = function(e: string, d: Record<string, unknown>) {
  if (!this.enabled) return;
  const entry = { event: e, data: d || {}, moduleId: this.moduleId, timestamp: Date.now() };
  this._events.push(entry);
  if (this._events.length > this._max) this._events.shift();
  const eb = Ports.get('eventBus');
  if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, entry);
};

Tracker.prototype.getEvents = function() { return this._events.slice(); };
Tracker.prototype.clear = function() { this._events.length = 0; };

Tracker.prototype.healthCheck = function() {
  return { status: 'healthy', enabled: this.enabled, eventCount: this._events.length, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true, version: VERSION, moduleId: MODULE_ID };
};

Tracker.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, portsInitialized: Ports.isInitialized(), usingP18Intents: true };
};

export function init(ctx: { ports?: Record<string, unknown> } | null) {
  Ports.init();
  if (ctx && ctx.ports) Ports.inject(ctx.ports);
  return { ok: true, version: VERSION };
}

export default Tracker;
