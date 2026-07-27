// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer.telemetry.tracker
// PURPOSE: Overlay Layer - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   OVERLAY_INTENTS, OVERLAY_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   trackEvent() — exported function
//   trackLifecycle() — exported function
//   trackOpen() — exported function
//   trackClose() — exported function
//   trackError() — exported function
//   getEvents() — exported function
//   getRecentEvents() — exported function
//   getMetrics() — exported function
//   getStats() — exported function
//   clear() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   TRACKER_EVENTS — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   eventKey
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { OVERLAY_INTENTS, OVERLAY_EVENTS } from '/core/runtime/events/catalog/overlay.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

const VERSION = '2.5.0-P18EC';
const MODULE_ID = 'overlay-layer.telemetry.tracker';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: DynObj) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const NAMESPACE = 'overlay-layer';
const MAX_EVENTS = 100;
const hasWindow = typeof window !== 'undefined';
let events: DynObj[] = [];
let metrics = { totalEvents: 0, lifecycleEvents: 0, stackEvents: 0, errorEvents: 0, lastEventAt: null as DynObj };

// P18EC: Hybrid - catalog tokens for cross-module, local for internal telemetry
const TRACKER_EVENTS = Object.freeze({
  LIFECYCLE_INIT: 'overlay.lifecycle.init',
  LIFECYCLE_READY: 'overlay.lifecycle.ready',
  LIFECYCLE_DESTROY: 'overlay.lifecycle.destroy',
  OPEN: OVERLAY_INTENTS.OPEN,
  CLOSE: OVERLAY_INTENTS.CLOSE,
  ERROR_INIT: OVERLAY_EVENTS.ERROR,
  ERROR_RENDER: 'overlay.error.render',
  ERROR_CLOSE: 'overlay.error.close',
  STACK_PUSH: 'overlay.stack.push',
  STACK_POP: 'overlay.stack.pop'
});

function logEvent(type: DynObj, data: DynObj) { if (!data) data = {}; const event = { id: `${NAMESPACE}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, namespace: NAMESPACE, type, data, timestamp: Date.now() }; events.push(event); if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS); metrics.totalEvents++; metrics.lastEventAt = event.timestamp; return event; }

function trackEvent(eventKey: string, data: DynObj) { if (!data) data = {}; const event = logEvent(eventKey, data); if (eventKey.indexOf('stack') !== -1) metrics.stackEvents++; const tc = _getPort('telemetry'); if (tc && tc.track) { try { tc.track(`${NAMESPACE}.${eventKey.replace(/[:.]/g, '.')}`, data); } catch (e) {} } const eb = _getPort('eventBus'); if (eb && eb.emit) { try { eb.emit(eventKey, data); } catch (e) {} } return event; }

function trackLifecycle(action: DynObj, data: DynObj) { if (!data) data = {}; metrics.lifecycleEvents++; const eventKey = action === 'init' ? TRACKER_EVENTS.LIFECYCLE_INIT : action === 'ready' ? TRACKER_EVENTS.LIFECYCLE_READY : action === 'destroy' ? TRACKER_EVENTS.LIFECYCLE_DESTROY : `overlay.lifecycle.${action}`; return trackEvent(eventKey, data); }
function trackOpen(id: DynObj, type: DynObj, scope: DynObj) { return trackEvent(TRACKER_EVENTS.OPEN, { id, type, scope }); }
function trackClose(id: DynObj, reason: DynObj) { return trackEvent(TRACKER_EVENTS.CLOSE, { id, reason }); }
function trackError(type: DynObj, error: DynObj) { metrics.errorEvents++; const eventKey = type === 'init' ? TRACKER_EVENTS.ERROR_INIT : type === 'render' ? TRACKER_EVENTS.ERROR_RENDER : type === 'close' ? TRACKER_EVENTS.ERROR_CLOSE : `overlay.error.${type}`; return trackEvent(eventKey, { message: error && error.message ? error.message : String(error), stack: error && error.stack ? error.stack.slice(0, 200) : '' }); }
function getEvents(limit: number) { if (!limit) limit = 50; return events.slice(-limit); }
function getRecentEvents(count: number) { if (!count) count = 10; return events.slice(-count); }
function getMetrics() { return Object.assign({}, metrics); }
function getStats() { const eb = _getPort('eventBus'); const tc = _getPort('telemetry'); return { totalEvents: metrics.totalEvents, lifecycleEvents: metrics.lifecycleEvents, stackEvents: metrics.stackEvents, errorEvents: metrics.errorEvents, lastEventAt: metrics.lastEventAt, bufferSize: events.length, telemetryCoreAvailable: !!tc, eventBusAvailable: !!eb }; }
function clear() { events = []; metrics = { totalEvents: 0, lifecycleEvents: 0, stackEvents: 0, errorEvents: 0, lastEventAt: null }; }
function getVersion() { return VERSION; }

function healthCheck() { const checks = { hasMetrics: true, lowErrorRate: metrics.totalEvents === 0 || (metrics.errorEvents / metrics.totalEvents) < 0.2, bufferHealthy: events.length < MAX_EVENTS * 0.9, portsInitialized: Ports.isInitialized(), usingCatalogIntents: true }; let passed = 0; for (const k in checks) { if ((checks as DynObj)[k]) passed++; } return { status: passed === Object.keys(checks).length ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${Object.keys(checks).length}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), stats: getStats(), recentEvents: getRecentEvents(5).map(e => e.type), usingCatalogIntents: true, timestamp: Date.now() }; }

export { trackEvent, trackLifecycle, trackOpen, trackClose, trackError, getEvents, getRecentEvents, getMetrics, getStats, clear, getVersion, healthCheck, info, TRACKER_EVENTS, VERSION, MODULE_ID, injectPorts, getPorts };

export default { trackEvent, trackLifecycle, trackOpen, trackClose, trackError, getEvents, getRecentEvents, getMetrics, getStats, clear, getVersion, healthCheck, info, TRACKER_EVENTS, VERSION, MODULE_ID, injectPorts, getPorts };
