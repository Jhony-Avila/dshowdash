let ports = {
  eventBus: null,
  logger: null,
  config: null,
  api: null,
  auth: null,
  telemetry: null
};
function setPorts(newPorts) {
  ports = { ...ports, ...newPorts };
}
function getPorts() {
  return { ...ports };
}
function getPort(name) {
  return ports[name];
}
var ports_default = { setPorts, getPorts, getPort };
const MODULE_ID = "panel-18/ports";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  getPort,
  getPorts,
  healthCheck,
  info,
  setPorts
};
