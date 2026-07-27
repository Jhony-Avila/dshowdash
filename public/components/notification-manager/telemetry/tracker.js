import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "2.4.0-P18EC";
const MODULE_ID = "notification-manager-tracker";
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
const _metrics = { events: 0, notifications: 0, errors: 0, lastEventAt: null };
function track(event, data) {
  _initPorts();
  data = data || {};
  _metrics.events++;
  _metrics.lastEventAt = Date.now();
  if (event.indexOf("error") > -1) _metrics.errors++;
  if (event.indexOf("notification") > -1) _metrics.notifications++;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, { source: MODULE_ID, event, data, timestamp: Date.now() });
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics.events = 0;
  _metrics.notifications = 0;
  _metrics.errors = 0;
  _metrics.lastEventAt = null;
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const checks = { hasMetrics: true, lowErrorRate: _metrics.events === 0 || _metrics.errors / _metrics.events < 0.2, portsInitialized: portsSnapshot._initialized, p18IntentsAvailable: true };
  let passed = 0;
  let total = 0;
  for (const k in checks) {
    if (checks.hasOwnProperty(k)) {
      total++;
      if (checks[k]) passed++;
    }
  }
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, portsInitialized: portsSnapshot._initialized, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized, usingP18Intents: true, metrics: getMetrics(), timestamp: Date.now() };
}
var tracker_default = { track, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  tracker_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  track
};
