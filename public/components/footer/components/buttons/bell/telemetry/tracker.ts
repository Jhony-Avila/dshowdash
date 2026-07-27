// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-button-bell-tracker
// PURPOSE: Footer bell Button - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/catalog/telemetry.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   track() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   TELEMETRY_INTENTS.TRACK
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
const MODULE_ID = 'footer-button-bell-tracker';
const VERSION = '1.5.0-P18EC';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _metrics = { mounted: 0, unmounted: 0, clicked: 0, errors: 0, lastEvent: (null as string|null) };
// @ts-expect-error TS migration - TS2322
export function track(event: string, data?: Record<string, unknown>) { if (data === undefined) data = {}; _metrics.lastEvent = { event, data, timestamp: Date.now() }; switch (event) { case 'mounted': _metrics.mounted++; break; case 'unmounted': _metrics.unmounted++; break; case 'clicked': _metrics.clicked++; break; case 'error': _metrics.errors++; break; } const eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) { eventBus.emit(TELEMETRY_INTENTS.TRACK, { source: MODULE_ID, event, data, timestamp: Date.now() }); } }
export function getMetrics() { return Object.assign({}, _metrics); }
export function resetMetrics() { _metrics.mounted = 0; _metrics.unmounted = 0; _metrics.clicked = 0; _metrics.errors = 0; _metrics.lastEvent = null; }
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: ps._initialized, usingP18Intents: true }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { trackerReady: true, portsInitialized: ps._initialized, p18IntentsAvailable: true }, metrics: getMetrics() }; }
export { MODULE_ID, VERSION };
export default { track, getMetrics, resetMetrics, info, healthCheck, VERSION, MODULE_ID };
