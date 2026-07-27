// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-currency-usd-brl/telemetry/tracker
// PURPOSE: Status Currency USD-BRL - Event Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
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
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-status-currency-usd-brl/telemetry/tracker';
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
    healthCheck() { const portsSnapshot = Ports.snapshot(); return { status: portsSnapshot._initialized ? 'HEALTHY' : 'DEGRADED', enabled: this.enabled, eventCount: this._events.length, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, p18IntentsAvailable: true }; }
    info() { const portsSnapshot = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, portsInitialized: portsSnapshot._initialized, usingP18Intents: true }; }
}
export default Tracker;
