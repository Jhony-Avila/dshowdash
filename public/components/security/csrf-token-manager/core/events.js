import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS, AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
const VERSION = "3.0.0-P18EC";
const MODULE_ID = "security.csrf-token-manager.core.events";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const CSRF_EVENTS = Object.freeze({ TOKEN_REFRESHED: "csrf:token:refreshed", TOKEN_EXPIRED: "csrf:token:expired", TOKEN_ERROR: "csrf:token:error", AUTH_CHANGED: "csrf:auth:changed" });
function emit(event, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(event, data);
}
function emitEvent(event, data) {
  emit(event, data);
}
function emitLoginRequired(reason = "unknown", context = {}) {
  emit(AUTH_INTENTS.LOGIN, Object.assign({ reason, timestamp: Date.now() }, context));
}
function emitLogout(reason) {
  emit(AUTH_EVENTS.LOGOUT, { reason: reason || "user_action", timestamp: Date.now() });
}
function emitSessionExpired() {
  emit(AUTH_EVENTS.SESSION_EXPIRED, { timestamp: Date.now() });
}
function on(event, handler) {
  const eb = _getPort("eventBus");
  if (eb && eb.on) eb.on(event, handler);
}
function off(event, handler) {
  const eb = _getPort("eventBus");
  if (eb && eb.off) eb.off(event, handler);
}
function healthCheck() {
  const checks = { csrfEventsValid: Object.keys(CSRF_EVENTS).length > 0, authEventsValid: Object.keys(AUTH_EVENTS).length > 0, eventBusAvailable: !!_getPort("eventBus"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), csrfEvents: Object.keys(CSRF_EVENTS), authEvents: Object.keys(AUTH_EVENTS), eventBusAvailable: !!_getPort("eventBus"), timestamp: Date.now() };
}
var events_default = { CSRF_EVENTS, AUTH_EVENTS, AUTH_INTENTS, emit, emitEvent, emitLoginRequired, emitLogout, emitSessionExpired, on, off, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  AUTH_EVENTS,
  AUTH_INTENTS,
  CSRF_EVENTS,
  MODULE_ID,
  VERSION,
  events_default as default,
  emit,
  emitEvent,
  emitLoginRequired,
  emitLogout,
  emitSessionExpired,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  off,
  on
};
