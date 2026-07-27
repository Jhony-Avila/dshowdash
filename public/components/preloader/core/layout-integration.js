import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.4.0-P17WI";
const MODULE_ID = "preloader-layout-integration";
const hasWindow = typeof window !== "undefined";
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
const log = { debug(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
function emitLayoutRequest(mode, source) {
  if (source === void 0) source = "preloader-system";
  if (!hasWindow) return false;
  _initPorts();
  const lm = _getPort("layoutManager");
  if (lm && lm.setPreloaderActive) {
    const isActive = mode === "preloader-active";
    lm.setPreloaderActive(isActive);
    if (lm.setScrollLocked) lm.setScrollLocked(isActive);
    log.debug("LayoutManager called via port", { preloaderActive: isActive });
    return true;
  }
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode, source, timestamp: Date.now() });
    return true;
  }
  return false;
}
function notifyPreloaderActive() {
  return emitLayoutRequest("preloader-active");
}
function notifyPreloaderInactive() {
  return emitLayoutRequest("preloader-inactive");
}
function healthCheck() {
  _initPorts();
  const lm = _getPort("layoutManager");
  const eb = _getPort("eventBus");
  const checks = { hasLayoutManager: !!lm, hasEventBus: !!eb, hasLogger: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, version: VERSION, moduleId: MODULE_ID, checks, portsInitialized: Ports.isInitialized() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
var layout_integration_default = { emitLayoutRequest, notifyPreloaderActive, notifyPreloaderInactive, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  layout_integration_default as default,
  emitLayoutRequest,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  notifyPreloaderActive,
  notifyPreloaderInactive
};
