import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "1.4.0-P18EC";
const MODULE_ID = "ui-orchestrator.telemetry.tracker";
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
const _metrics = { tracked: 0, emitted: 0 };
function init(context = {}) {
  if (context === void 0) context = {};
  return { version: VERSION, moduleId: MODULE_ID };
}
function track(event, data = {}) {
  if (data === void 0) data = {};
  _metrics.tracked++;
  const payload = Object.assign({ event, source: MODULE_ID, timestamp: Date.now() }, data);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, payload);
  return payload;
}
function emit(event, data = {}) {
  if (data === void 0) data = {};
  _metrics.emitted++;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), hasEvents: !!_getPort("eventBus"), portsInitialized: Ports.isInitialized(), usingP18Intents: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true };
}
var tracker_default = { init, track, emit, getMetrics, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  tracker_default as default,
  emit,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  track
};
