import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID } from "./constants.js";
const VERSION = "1.1.0-ENTERPRISE";
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
  VERSION,
  getPort,
  getPorts,
  initPorts,
  injectPorts
};
