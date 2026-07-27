import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "features-integration.helpers";
const VERSION = "1.1.0-P0-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function getCM() {
  return typeof window !== "undefined" ? window.ContainerMain : null;
}
function getEventBus() {
  _initPorts();
  return Ports.get("eventBus");
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p0Enterprise: true, portsInitialized: _portsInitialized };
}
var helpers_default = { getCM, getEventBus, injectPorts, getPorts, info, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  getCM,
  getEventBus,
  getPorts,
  info,
  injectPorts
};
