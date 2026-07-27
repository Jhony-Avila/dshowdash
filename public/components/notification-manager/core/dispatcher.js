import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.3.0-P18EC";
const MODULE_ID = "notification-manager-dispatcher";
const NOTIFICATION_EVENTS = { SHOW: "notification:show", HIDE: "notification:hide" };
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
const _metrics = { dispatched: 0 };
function dispatch(notification) {
  _initPorts();
  _metrics.dispatched++;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(NOTIFICATION_EVENTS.SHOW, notification);
  return true;
}
function dismiss(id) {
  _initPorts();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(NOTIFICATION_EVENTS.HIDE, { id });
  return true;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const eb = _getPort("eventBus");
  const checks = { eventBusAvailable: !!eb, portsInitialized: portsSnapshot._initialized };
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
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized, metrics: getMetrics(), timestamp: Date.now() };
}
var dispatcher_default = { dispatch, dismiss, NOTIFICATION_EVENTS, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  NOTIFICATION_EVENTS,
  VERSION,
  dispatcher_default as default,
  dismiss,
  dispatch,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
