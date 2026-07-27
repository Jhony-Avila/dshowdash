const MODULE_ID = "panel-health-dashboard.ports";
const VERSION = "9.3.0-P2-ENTERPRISE";
let ports = {
  eventBus: null,
  logger: null,
  config: null,
  api: null,
  telemetry: null
};
let _initialized = false;
function setPorts(newPorts) {
  ports = { ...ports, ...newPorts };
  _initialized = true;
}
function getPorts() {
  return { ...ports };
}
function getPort(name) {
  return ports[name];
}
const initPorts = setPorts;
function isPortsInitialized() {
  return _initialized;
}
var ports_default = { setPorts, getPorts, getPort, initPorts, isPortsInitialized };
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  getPort,
  getPorts,
  initPorts,
  isPortsInitialized,
  setPorts
};
