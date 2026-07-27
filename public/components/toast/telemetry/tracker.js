import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { TOAST_EVENTS } from "../toast-catalog.js";
const VERSION = "2.1.0-P18EC";
const MODULE_ID = "toast.telemetry.tracker";
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
let _metrics = { shown: 0, dismissed: 0, dismissedByUser: 0, dismissedByTimeout: 0, actionsClicked: 0, byType: { success: 0, info: 0, warning: 0, error: 0, critical: 0 }, errors: 0 };
function init(options) {
  if (options === void 0) options = {};
  if (options.eventBus) Ports.inject({ eventBus: options.eventBus });
  return { success: true, hasEventBus: !!_getPort("eventBus") };
}
function track(event, data) {
  if (data === void 0) data = {};
  const payload = Object.assign({}, data, { module: MODULE_ID, timestamp: Date.now() });
  switch (event) {
    case TOAST_EVENTS.SHOWN:
      _metrics.shown++;
      if (data.type && _metrics.byType[data.type] !== void 0) _metrics.byType[data.type]++;
      break;
    case TOAST_EVENTS.DISMISSED:
      _metrics.dismissed++;
      if (data.source === "user") _metrics.dismissedByUser++;
      if (data.source === "timeout") _metrics.dismissedByTimeout++;
      break;
    case TOAST_EVENTS.ACTION_CLICKED:
      _metrics.actionsClicked++;
      break;
    case TOAST_EVENTS.ERROR:
      _metrics.errors++;
      break;
  }
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(event, payload);
  return payload;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { shown: 0, dismissed: 0, dismissedByUser: 0, dismissedByTimeout: 0, actionsClicked: 0, byType: { success: 0, info: 0, warning: 0, error: 0, critical: 0 }, errors: 0 };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), hasEventBus: !!_getPort("eventBus"), portsInitialized: Ports.isInitialized(), catalogVersion: "TOAST_EVENTS" };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, hasEventBus: !!_getPort("eventBus"), metrics: getMetrics(), portsInitialized: Ports.isInitialized() };
}
var tracker_default = { init, track, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID, TOAST_EVENTS };
export {
  MODULE_ID,
  VERSION,
  tracker_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  resetMetrics,
  track
};
