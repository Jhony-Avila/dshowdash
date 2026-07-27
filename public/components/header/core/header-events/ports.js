import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID } from "./constants.js";
const VERSION = "6.0.0-P0-AUTH-OWNERSHIP";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function initPorts() {
  Ports.init();
}
function getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function isPortsInitialized() {
  return Ports.isInitialized();
}
export {
  Ports,
  VERSION,
  getPort,
  getPorts,
  initPorts,
  injectPorts,
  isPortsInitialized
};
