// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui-orchestrator.telemetry.tracker
// PURPOSE: UI Orchestrator Telemetry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   track() — exported function
//   emit() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   TELEMETRY_INTENTS.TRACK
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
export const VERSION = '1.4.0-P18EC';
export const MODULE_ID = 'ui-orchestrator.telemetry.tracker';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts(): void { Ports.init(); }
function _getPort(name: string): Record<string, unknown> { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>): unknown { return Ports.inject(p); }
export function getPorts(): Record<string, unknown> { return Ports.snapshot(); }
const _metrics = { tracked: 0, emitted: 0 };
export function init(context: Record<string, unknown> = {}): { version: string; moduleId: string } { if (context === undefined) context = {}; return { version: VERSION, moduleId: MODULE_ID }; }
export function track(event: string, data: Record<string, unknown> = {}): Record<string, unknown> { if (data === undefined) data = {}; _metrics.tracked++; const payload = Object.assign({ event, source: MODULE_ID, timestamp: Date.now() }, data); const eb = _getPort('eventBus') as { emit?: (e: string, d: unknown) => void } | null; if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, payload); return payload; }
export function emit(event: string, data: Record<string, unknown> = {}): void { if (data === undefined) data = {}; _metrics.emitted++; const eb = _getPort('eventBus') as { emit?: (e: string, d: unknown) => void } | null; if (eb && eb.emit) eb.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() })); }
export function getMetrics(): { tracked: number; emitted: number } { return Object.assign({}, _metrics); }
export function info(): Record<string, unknown> { return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), hasEvents: !!_getPort('eventBus'), portsInitialized: Ports.isInitialized(), usingP18Intents: true }; }
export function healthCheck(): Record<string, unknown> { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true }; }
export default { init, track, emit, getMetrics, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
