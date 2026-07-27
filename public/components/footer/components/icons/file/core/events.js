import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
const MODULE_ID = "footer-icon-file-events";
const VERSION = "1.5.0-P18EC";
const COMPONENT_ID = "footer:file";
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
const _metrics = { clicks: 0, mounts: 0, unmounts: 0, uiActions: 0 };
function emitUIAction(data) {
  if (data === void 0) data = {};
  _metrics.uiActions++;
  const eventBus = _getPort("eventBus");
  if (!eventBus || !eventBus.emit) return;
  eventBus.emit(UI_EVENTS.ACTION, { actionId: COMPONENT_ID, source: MODULE_ID, timestamp: Date.now(), kind: "navigation", meta: Object.assign({ label: "File" }, data) });
}
const EventsHandler = { _clickHandler: null, _element: null, init() {
  _initPorts();
}, bindClick(element, callback) {
  this._element = element;
  this._clickHandler = () => {
    _metrics.clicks++;
    if (callback) callback();
    emitUIAction({ clicked: true });
  };
  if (element) element.addEventListener("click", this._clickHandler);
}, emitClicked(props) {
  _metrics.clicks++;
  emitUIAction({ clicked: true, props });
}, emitMounted(props) {
  _metrics.mounts++;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: COMPONENT_ID, moduleId: MODULE_ID, props, timestamp: Date.now() });
}, emitUnmounted() {
  _metrics.unmounts++;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.UNMOUNTED, { componentId: COMPONENT_ID, moduleId: MODULE_ID, timestamp: Date.now() });
}, cleanup() {
  if (this._element && this._clickHandler) {
    this._element.removeEventListener("click", this._clickHandler);
  }
  this._element = null;
  this._clickHandler = null;
}, destroy() {
  this.cleanup();
} };
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: ps._initialized };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const eb = _getPort("eventBus");
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { eventBusAvailable: !!eb, portsInitialized: ps._initialized }, metrics: getMetrics() };
}
var events_default = Object.assign({}, EventsHandler, { getMetrics, info, healthCheck, MODULE_ID, VERSION });
export {
  EventsHandler,
  MODULE_ID,
  VERSION,
  events_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
