import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "8.1.0-DI-STRICT";
const MODULE_ID = "container-tab-manager-ports";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function init() {
  Ports.init();
}
function get(name) {
  return Ports.get(name);
}
function inject(p) {
  return Ports.inject(p);
}
function snapshot() {
  return Ports.snapshot();
}
function isInitialized() {
  return Ports.isInitialized();
}
function emitEvent(eventType, payload) {
  const eb = get("eventBus");
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: isInitialized() };
}
function healthCheck() {
  return { status: isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { portsInitialized: isInitialized() } };
}
var ports_default = { init, get, inject, snapshot, isInitialized, emitEvent, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  emitEvent,
  get,
  healthCheck,
  info,
  init,
  inject,
  isInitialized,
  snapshot
};
