import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const MODULE_ID = "footer-button-bell-tracker";
const VERSION = "1.5.0-P18EC";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _metrics = { mounted: 0, unmounted: 0, clicked: 0, errors: 0, lastEvent: null };
function track(event, data) {
  if (data === void 0) data = {};
  _metrics.lastEvent = { event, data, timestamp: Date.now() };
  switch (event) {
    case "mounted":
      _metrics.mounted++;
      break;
    case "unmounted":
      _metrics.unmounted++;
      break;
    case "clicked":
      _metrics.clicked++;
      break;
    case "error":
      _metrics.errors++;
      break;
  }
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(TELEMETRY_INTENTS.TRACK, { source: MODULE_ID, event, data, timestamp: Date.now() });
  }
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics.mounted = 0;
  _metrics.unmounted = 0;
  _metrics.clicked = 0;
  _metrics.errors = 0;
  _metrics.lastEvent = null;
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: ps._initialized, usingP18Intents: true };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { trackerReady: true, portsInitialized: ps._initialized, p18IntentsAvailable: true }, metrics: getMetrics() };
}
var tracker_default = { track, getMetrics, resetMetrics, info, healthCheck, VERSION, MODULE_ID };
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
