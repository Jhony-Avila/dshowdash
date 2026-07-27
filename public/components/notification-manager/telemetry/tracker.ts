// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-manager-tracker
// PURPOSE: Notification Manager - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   track() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
const MODULE_ID = 'notification-manager-tracker';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }
const _metrics: { events: number; notifications: number; errors: number; lastEventAt: number | null } = { events: 0, notifications: 0, errors: 0, lastEventAt: null };
function track(event: string, data: Record<string, unknown>) { _initPorts(); data = data || {}; _metrics.events++; _metrics.lastEventAt = Date.now(); if (event.indexOf('error') > -1) _metrics.errors++; if (event.indexOf('notification') > -1) _metrics.notifications++; const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, { source: MODULE_ID, event, data, timestamp: Date.now() }); }
function getMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics.events = 0; _metrics.notifications = 0; _metrics.errors = 0; _metrics.lastEventAt = null; }
function healthCheck() { const portsSnapshot = Ports.snapshot(); const checks: Record<string, boolean> = { hasMetrics: true, lowErrorRate: _metrics.events === 0 || (_metrics.errors / _metrics.events) < 0.2, portsInitialized: portsSnapshot._initialized, p18IntentsAvailable: true }; let passed = 0; let total = 0; for (const k in checks) { if (checks.hasOwnProperty(k)) { total++; if (checks[k]) passed++; } } return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, portsInitialized: portsSnapshot._initialized, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
function info() { const portsSnapshot = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized, usingP18Intents: true, metrics: getMetrics(), timestamp: Date.now() }; }
export { VERSION, MODULE_ID, track, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts };
export default { track, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
