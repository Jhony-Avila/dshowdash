// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: security.csrf-token-manager.telemetry.tracker
// PURPOSE: CSRF Token Manager - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SECURITY_EVENTS — exported value
//   initTracker() — exported function
//   trackSecurityEvent() — exported function
//   track() — exported function
//   getRecentEvents() — exported function
//   clearEvents() — exported function
//   getTrackerStats() — exported function
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
const VERSION = '2.5.0-P18EC';
const MODULE_ID = 'security.csrf-token-manager.telemetry.tracker';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }
const SECURITY_EVENTS = Object.freeze({ CSRF_REFRESHED: 'security:csrf:refreshed', CSRF_ENSURE_FRESH: 'security:csrf:ensure-fresh', CSRF_ERROR: 'security:csrf:error', AUTH_CHANGED: 'security:auth:changed', SESSION_EXPIRED: 'security:session:expired', MODULE_INIT: 'security:module:init', MODULE_SHUTDOWN: 'security:module:shutdown', MODULE_RESET: 'security:module:reset', TOKEN_REFRESH: 'security:token:refresh', TOKEN_INVALID: 'security:token:invalid' });
const _state: { initialized: boolean; config: Record<string, unknown> | null } = { initialized: false, config: null };
const _metrics: { events: number; tokenRefreshes: number; errors: number; lastEventAt: number | null } = { events: 0, tokenRefreshes: 0, errors: 0, lastEventAt: null };
const _recentEvents: Array<{ type: string; data: Record<string, unknown>; timestamp: number }> = [];
const MAX_RECENT_EVENTS = 100;
function initTracker(config: Record<string, unknown>) { if (_state.initialized) return; _state.initialized = true; _state.config = config || {}; }
function trackSecurityEvent(eventType: string, data: Record<string, unknown> = {}) {
  _metrics.events++;_metrics.lastEventAt = Date.now();if (eventType.indexOf('error') > -1) _metrics.errors++;if (eventType.indexOf('refresh') > -1) _metrics.tokenRefreshes++;const event = { type: eventType, data, timestamp: Date.now() };_recentEvents.unshift(event);if (_recentEvents.length > MAX_RECENT_EVENTS) _recentEvents.pop();const eb = _getPort('eventBus');if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, { source: MODULE_ID, event: eventType, data, timestamp: Date.now() });
}
function track(event: string, data: Record<string, unknown>) { trackSecurityEvent(event, data); }
function getRecentEvents(limit: number) { return _recentEvents.slice(0, limit || 10); }
function clearEvents() { _recentEvents.length = 0; resetMetrics(); }
function getTrackerStats() { return { initialized: _state.initialized, totalEvents: _metrics.events, recentEventsCount: _recentEvents.length, errors: _metrics.errors, tokenRefreshes: _metrics.tokenRefreshes, lastEventAt: _metrics.lastEventAt }; }
function getMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics.events = 0; _metrics.tokenRefreshes = 0; _metrics.errors = 0; _metrics.lastEventAt = null; }
function healthCheck() { const checks = { initialized: _state.initialized, hasMetrics: true, lowErrorRate: _metrics.events === 0 || (_metrics.errors / _metrics.events) < 0.2, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), initialized: _state.initialized, usingP18Intents: true, timestamp: Date.now() }; }
export { VERSION, MODULE_ID, SECURITY_EVENTS, initTracker, trackSecurityEvent, track, getRecentEvents, clearEvents, getTrackerStats, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts };
export default { SECURITY_EVENTS, initTracker, trackSecurityEvent, track, getRecentEvents, clearEvents, getTrackerStats, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
