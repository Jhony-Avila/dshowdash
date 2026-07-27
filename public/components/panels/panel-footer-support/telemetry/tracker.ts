// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-footer-support/telemetry/tracker
// PURPOSE: Footer Support - Event Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTelemetryPorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/catalog/telemetry.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createTelemetryPorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-footer-support/telemetry/tracker';
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export class Tracker {
  [key: string]: any;
  constructor(options: { moduleId?: string; enabled?: boolean; maxEvents?: number } = {}) { _initPorts(); this.moduleId = options.moduleId || 'panels/panel-footer-support'; this.enabled = options.enabled !== false; this._events = []; this._maxEvents = options.maxEvents || 1000; }
  track(event: string, data: Record<string, unknown> = {}) { if (!this.enabled) return; const entry = { event, data, moduleId: this.moduleId, timestamp: Date.now() }; this._events.push(entry); if (this._events.length > this._maxEvents) this._events.shift(); _getPort('eventBus')?.emit?.(TELEMETRY_INTENTS.TRACK, entry); }
  getEvents() { return [...this._events]; }
  getEventsByType(event: string) { return this._events.filter((e: { event: string }) => e.event === event); }
  clear() { this._events.length = 0; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  healthCheck() { const ps = Ports.snapshot(); return { status: 'healthy', enabled: this.enabled, eventCount: this._events.length, portsInitialized: ps._initialized, p18IntentsAvailable: true, version: VERSION, moduleId: MODULE_ID }; }
  info() { const ps = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, portsInitialized: ps._initialized, usingP18Intents: true, healthCheck: this.healthCheck() }; }
}
export default Tracker;
