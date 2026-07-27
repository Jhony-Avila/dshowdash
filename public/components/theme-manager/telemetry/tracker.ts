// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-manager-tracker
// PURPOSE: Theme Manager - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   track() — exported function
//   trackThemeEvent — exported value
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getEventLog() — exported function
//   getRecentEvents() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
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
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
const VERSION = '2.4.0-P18EC';
const MODULE_ID = 'theme-manager-tracker';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: unknown) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }
const _metrics: { events: number; themeChanges: number; errors: number; lastEventAt: number | null } = { events: 0, themeChanges: 0, errors: 0, lastEventAt: null };
function track(event: string, data?: Record<string, unknown>) { _initPorts(); if (data === undefined) data = {}; _metrics.events++; _metrics.lastEventAt = Date.now(); if (event.indexOf('error') !== -1) _metrics.errors++; if (event.indexOf('change') !== -1) _metrics.themeChanges++; const eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) { eventBus.emit(TELEMETRY_INTENTS.TRACK, { source: MODULE_ID, event, data, timestamp: Date.now() }); } }
function getMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics.events = 0; _metrics.themeChanges = 0; _metrics.errors = 0; _metrics.lastEventAt = null; }
function healthCheck() { const portsSnapshot = Ports.snapshot(); const checks = { hasMetrics: true, lowErrorRate: _metrics.events === 0 || (_metrics.errors / _metrics.events) < 0.2, portsInitialized: portsSnapshot._initialized, p18IntentsAvailable: true }; const values = Object.values(checks); const passed = values.filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() }; }
function info() { const portsSnapshot = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: portsSnapshot._initialized, usingP18Intents: true, timestamp: Date.now() }; }
const trackThemeEvent = track;
const getEventLog = (): unknown[] => [];
const getRecentEvents = (): unknown[] => [];
export { VERSION, MODULE_ID };
export { track, trackThemeEvent, getMetrics, resetMetrics, healthCheck, info, getEventLog, getRecentEvents };
export { injectPorts, getPorts };
export default { track, trackThemeEvent, getMetrics, resetMetrics, healthCheck, info, getEventLog, getRecentEvents, injectPorts, getPorts, VERSION, MODULE_ID };
