// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: security.csrf-token-manager.core.events
// PURPOSE: CSRF Token Manager - Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CSRF_EVENTS — exported value
//   AUTH_EVENTS — exported value
//   AUTH_INTENTS — exported value
//   emit() — exported function
//   emitEvent() — exported function
//   emitLoginRequired() — exported function
//   emitLogout() — exported function
//   emitSessionExpired() — exported function
//   on() — exported function
//   off() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS, AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';
const VERSION = '3.0.0-P18EC';
const MODULE_ID = 'security.csrf-token-manager.core.events';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }
// CSRF_EVENTS - local (específico deste módulo)
const CSRF_EVENTS = Object.freeze({ TOKEN_REFRESHED: 'csrf:token:refreshed', TOKEN_EXPIRED: 'csrf:token:expired', TOKEN_ERROR: 'csrf:token:error', AUTH_CHANGED: 'csrf:auth:changed' });
function emit(event: string, data: unknown) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(event, data); }
function emitEvent(event: string, data: unknown) { emit(event, data); }
function emitLoginRequired(reason = 'unknown', context = {}) {
  emit(AUTH_INTENTS.LOGIN, Object.assign({ reason, timestamp: Date.now() }, context));
}
function emitLogout(reason: string) { emit(AUTH_EVENTS.LOGOUT, { reason: reason || 'user_action', timestamp: Date.now() }); }
function emitSessionExpired() { emit(AUTH_EVENTS.SESSION_EXPIRED, { timestamp: Date.now() }); }
function on(event: string, handler: (...args: unknown[]) => void) { const eb = _getPort('eventBus'); if (eb && eb.on) eb.on(event, handler); }
function off(event: string, handler: (...args: unknown[]) => void) { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(event, handler); }
function healthCheck() { const checks = { csrfEventsValid: Object.keys(CSRF_EVENTS).length > 0, authEventsValid: Object.keys(AUTH_EVENTS).length > 0, eventBusAvailable: !!_getPort('eventBus'), portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), csrfEvents: Object.keys(CSRF_EVENTS), authEvents: Object.keys(AUTH_EVENTS), eventBusAvailable: !!_getPort('eventBus'), timestamp: Date.now() }; }
export { VERSION, MODULE_ID, CSRF_EVENTS, AUTH_EVENTS, AUTH_INTENTS, emit, emitEvent, emitLoginRequired, emitLogout, emitSessionExpired, on, off, healthCheck, info, injectPorts, getPorts };
export default { CSRF_EVENTS, AUTH_EVENTS, AUTH_INTENTS, emit, emitEvent, emitLoginRequired, emitLogout, emitSessionExpired, on, off, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
