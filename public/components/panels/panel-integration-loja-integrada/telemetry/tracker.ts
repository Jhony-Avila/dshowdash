// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels.panel-integration-loja-integrada.telemetry.tracker
// PURPOSE: Panel Integration Loja Integrada - Event Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/catalog/telemetry.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
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
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
const MODULE_ID = 'panels.panel-integration-loja-integrada.telemetry.tracker';
const VERSION = '9.3.0-P2-ENTERPRISE';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export class Tracker {
  [key: string]: any;
  constructor(options: { moduleId?: string; enabled?: boolean; maxEvents?: number } = {}) { this.moduleId = options.moduleId || MODULE_ID; this.enabled = options.enabled !== false; this._events = []; this._maxEvents = options.maxEvents || 1000; }
  track(event: string, data: Record<string, unknown> = {}) { if (!this.enabled) return; const entry = { event, data, moduleId: this.moduleId, timestamp: Date.now() }; this._events.push(entry); if (this._events.length > this._maxEvents) this._events.shift(); Ports.get('eventBus')?.emit?.(TELEMETRY_INTENTS.TRACK, entry); }
  getEvents() { return [...this._events]; }
  getEventsByType(event: string) { return this._events.filter((e: Record<string, unknown>) => e.event === event); }
  clear() { this._events.length = 0; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  healthCheck() { return { status: 'healthy', enabled: this.enabled, eventCount: this._events.length, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, portsInitialized: Ports.isInitialized(), usingP18Intents: true }; }
}
const init = (ctx: { ports?: Record<string, unknown> } = {}) => { Ports.init(); if (ctx?.ports) Ports.inject(ctx.ports); return { ok: true, version: VERSION }; };
export { MODULE_ID, VERSION, init };
export default Tracker;
