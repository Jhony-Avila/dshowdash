// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-dashboard/telemetry/tracker
// PURPOSE: Dashboard - Event Tracker
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
//   Tracker — exported class
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
export const MODULE_ID = 'panels/panel-dashboard/telemetry/tracker';
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export class Tracker {
  [key: string]: any;
    constructor(options: { moduleId?: string; enabled?: boolean; maxEvents?: number } = {}) { this.moduleId = options.moduleId || MODULE_ID; this.enabled = options.enabled !== false; this._events = []; this._maxEvents = 1000; _initPorts(); }
    track(event: string, data: Record<string, unknown> = {}) { if (!this.enabled) return; const entry = { event, data, moduleId: this.moduleId, timestamp: Date.now() }; this._events.push(entry); if (this._events.length > this._maxEvents) this._events.shift(); const eb = _getPort('eventBus'); eb?.emit?.(TELEMETRY_INTENTS.TRACK, entry); }
    getEvents() { return [...this._events]; }
    clear() { this._events.length = 0; }
    healthCheck() { const ps = Ports.snapshot(); return { status: 'healthy', enabled: this.enabled, eventCount: this._events.length, portsInitialized: ps._initialized, version: VERSION, moduleId: MODULE_ID }; }
    info() { const ps = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, portsInitialized: ps._initialized }; }
}
export default Tracker;
