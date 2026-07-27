import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID } from "./core/constants.js";
const VERSION = "5.0.0-P4-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const isPortsInitialized = () => Ports.isInitialized();
export {
  Ports,
  VERSION,
  getPort,
  getPorts,
  injectPorts,
  isPortsInitialized
};
