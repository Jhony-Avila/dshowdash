import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID } from "./constants.js";
const VERSION = "4.3.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
export {
  Ports,
  VERSION,
  getPort,
  getPorts,
  initPorts,
  injectPorts
};
